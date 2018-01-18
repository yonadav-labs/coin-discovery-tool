app.controller('PortfolioCtrl',
    ['$scope', '$stateParams', '$state', '$rootScope', '$interval', 'UserService', 'Request', 'CorsRequest', '$http', '$timeout', 'DTOptionsBuilder', 'Utill',
        function ($scope, $stateParams, $state, $rootScope, $interval, UserService, Request, CorsRequest, $http, $timeout, DTOptionsBuilder, Utill) {

            $scope.resetData = () => {
                $scope.postData = {
                    currency: 'USD',
                    price_type: 'perUnit',
                    transaction_date: moment().format('YYYY-MM-DD'),
                };
            };
            
            $scope.errors = [];
            $scope.showLoader = false;
            $scope.showPhoneForm = false;
            $scope.selectedCoin = {};
            $scope.assets = [];
            $scope.soldAssets = [];
            $scope.coins = [];
            $scope.coinPrices = [];
            $scope.soldCoinPrices = [];
            $scope.editMode = false;
            $scope.addMode = false;
            $scope.sellMode = false;
            $scope.showForm = false;    
            $scope.editSoldMode = false;                    
            $scope.date_opened = false;

            $scope.togglePhoneForm = () => {
                $scope.showPhoneForm != $scope.showPhoneForm
            };

            $scope.datatableOptions = DTOptionsBuilder.newOptions().withBootstrap();

            //===========Date Options=================
            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1,
                class: 'datepicker'
            };

            $scope.open = function ($event) {
                $event.preventDefault();
                $event.stopPropagation();
                // $timeout(function () {
                    $scope.date_opened = !$scope.date_opened;
                // });
            };
            //================================================

            $scope.submitAsset = () => {
                let asset = {
                    name: $scope.postData.coin.CoinName,
                    image_url: $scope.postData.coin.ImageUrl,
                    symbol: $scope.postData.coin.Symbol,
                    note: $scope.postData.note,
                    transaction_date: (typeof ($scope.postData.transaction_date) !== "string") 
                        ? moment($scope.postData.transaction_date).format("YYYY-MM-DD") 
                            : $scope.postData.transaction_date,
                    amount: $scope.postData.amount,
                    currency: $scope.postData.currency,
                    price_type: $scope.postData.price_type,
                };

                let date = (typeof ($scope.postData.transaction_date) !== "string") 
                ? moment($scope.postData.transaction_date).format("YYYY-MM-DD"): $scope.postData.transaction_date;
                if ($scope.editMode) {
                    console.log(asset.amount)
                    asset.amount =  asset.amount;
                    asset.buy_price = $scope.postData.price;
                    asset.transaction_date = date;
                    // if
                    $scope.updateAsset(asset);
                } 
                else if ($scope.addMode) {
                    asset.buy_price = $scope.postData.price;
                    $scope.saveAsset(asset);
                }
                else if($scope.sellMode) {
                    asset.id = $scope.postData.id; 
                    asset.asset_id = $scope.postData.id; 
                    asset.purchase_price = $scope.postData.purchase_price; 
                    asset.buy_price = $scope.postData.buy_price; 
                    asset.sell_price = $scope.postData.price;                   
                    $scope.sellAsset(asset);
                }
                else if ($scope.editSoldMode){
                    asset.id = $scope.postData.id;
                    asset.asset_id = $scope.postData.id;
                    asset.purchase_price = $scope.postData.purchase_price;
                    asset.buy_price = $scope.postData.buy_price;
                    asset.sell_price = $scope.postData.price; 
                    $scope.updateSellAsset(asset);
                }
            }


            //=============edit=============

            $scope.updateAsset = (asset) => {
                Utill.startLoader();
                let date = moment(asset.transaction_date).unix();

                CorsRequest.get(`data/pricehistorical?fsym=${asset.currency}&tsyms=BTC,USD,ETH,LTC,EUR&ts=${date}`).then(function (res) {
                    Utill.startLoader();
                    console.log(res.data);

                    if (asset.price_type === 'totalValue') {
                        asset.buy_price =  asset.buy_price / asset.amount;
                        // asset. = asset.amount.toFixed(2);
                        asset.price_type = 'perUnit';
                    }

                    if (asset.currency === 'USD') {
                        asset.purchase_price = asset.amount * asset.buy_price;

                    } else {
                        asset.purchase_price = res.data[asset.currency].USD * asset.buy_price;
                        asset.purchase_price = asset.purchase_price * asset.amount;
                    }
                    // asset.purchase_price = asset.buy_price * res.data.USD;
                    Request.put('assets/' + $scope.postData.id + '/', asset).then((res) => {
                        $scope.cancelEditAsset()
                        $scope.resetData();
                        $scope.getAssets();
                        Utill.endLoader();
                        Utill.showSuccess('Asset Added!')
                    }, (res) => {
                        Utill.endLoader();
                        Utill.showError('Add Asset Failed')
                    });
                    Utill.endLoader();
                }, function (res) {
                    Utill.endLoader();
                    console.log(res)
                })
            }

            $scope.updateSellAsset = (asset) => {
                Utill.startLoader();
                CorsRequest.get(`data/price?fsym=${asset.symbol}&tsyms=BTC,USD,EUR`).then(function (res) {
                    asset.market_price = res.data.USD;

                    if (asset.price_type === 'totalValue') {
                        asset.buy_price =  asset.buy_price / asset.amount;
                        // asset. = asset.amount.toFixed(2);
                        asset.price_type = 'perUnit';
                    }
                    Utill.endLoader();
                    Utill.startLoader();
                    Request.put('sell-assets/' + $scope.postData.id + '/', asset).then((res) => {
                        $scope.cancelEditAsset();
                        $scope.resetData();
                        $scope.getSoldAssets();
                        Utill.endLoader();
                        Utill.showSuccess('Asset Sold Updated!')
                    }, (res) => {
                        Utill.endLoader();
                        // Utill.showError('Sell Asset Failed')
                        Utill.showError(res.data.error)
                    });
                }, function (res) {
                    //body
                    Utill.endLoader();
                })
            }

            

            //==============save====================

            $scope.saveAsset = (asset) => {
                Utill.startLoader();
                let date = moment(asset.transaction_date).unix();

                console.log(date)
                CorsRequest.get(`data/pricehistorical?fsym=${asset.currency}&tsyms=BTC,USD,ETH,LTC,EUR&ts=${date}`).then(function (res) {
                    Utill.startLoader();
                    console.log(res.data)

                    if (asset.price_type === 'totalValue') {
                        asset.amount = asset.amount / asset.buy_price;
                        // asset.amount = asset.amount.toFixed(2);
                        asset.price_type = 'perUnit';
                    }

                    if (asset.currency === 'USD') {
                        asset.purchase_price = asset.amount * asset.buy_price;

                    } else {
                        asset.purchase_price = res.data[asset.currency].USD * asset.buy_price;
                        asset.purchase_price = asset.purchase_price * asset.amount;
                    }

                    // asset.purchase_price = asset.buy_price * res.data.USD;
                    Request.post('assets/', asset).then((res) => {
                        $scope.cancelEditAsset()
                        $scope.resetData();
                        $scope.getAssets();
                        $scope.getSoldAssets();
                        Utill.endLoader();
                        Utill.showSuccess('Asset Added!')
                    }, (res) => {
                        Utill.endLoader();
                        Utill.showError('Add Asset Failed')
                    });
                    Utill.endLoader();
                }, function (res) {
                    Utill.endLoader();
                    console.log(res)
                })
            }
           
            $scope.sellAsset = (asset) => {
                Utill.startLoader();
                let date = moment(asset.transaction_date).unix();            
                
                CorsRequest.get(`data/pricehistorical?fsym=${asset.currency}&tsyms=BTC,USD,ETH,LTC,EUR&ts=${date}`).then(function (res) {
                   
                    // Utill.startLoader();
                    Request.post('sell-assets/', asset).then((res) => {
                        $scope.cancelEditAsset();
                        $scope.resetData();
                        $scope.getAssets();
                        $scope.getSoldAssets();
                        Utill.endLoader();
                        Utill.showSuccess('Asset Sold!')
                    }, (res) => {
                        Utill.endLoader();
                        // Utill.showError('Sell Asset Failed')
                        Utill.showError(res.data.error)
                    });
                }, function (res) {
                    //body
                    Utill.endLoader();                    
                })
            }

            //==============delete==================

            $scope.deleteAnAsset = (asset) => {
                Utill.showConfirm('Are you sure?', () => {
                    Utill.startLoader();
                    Request.delete('assets/' + asset.id + '/').then((res) => {
                        $scope.getAssets();
                        Utill.endLoader();
                        Utill.showSuccess('Asset Deleted!');
                    }, (res) => {
                        Utill.endLoader();
                        Utill.showError('Delete Asset Failed');
                    });
                });
            }

            $scope.deleteSoldAsset = (asset) => {
                Utill.showConfirm('Are you sure?', () => {
                    Utill.startLoader();
                    Request.delete('sell-assets/' + asset.id + '/').then((res) => {
                        $scope.getSoldAssets();
                        Utill.endLoader();
                        Utill.showSuccess('Asset Deleted!');
                    }, (res) => {
                        Utill.endLoader();
                        Utill.showError('Delete Asset Failed');
                    });
                });
            }

            //=============populate form with data===============

            $scope.editAnAsset = (asset) => {
                $scope.showForm = true;
                $scope.editMode = true;

                if (asset.price_type === 'totalValue') {
                    asset.amount = asset.amount / asset.buy_price;
                }
                $scope.postData = {
                    id: asset.id,
                    note: asset.note,
                    amount: +asset.amount.toFixed(4),
                    transaction_date: asset.transaction_date,
                    price: +asset.buy_price,
                    currency: asset.currency,
                    price_type: asset.price_type,
                    coin: $scope.coins.find((coin) => {
                        return coin.Symbol === asset.symbol
                    })
                };
            }

            $scope.editSoldAsset = (asset) => {
                $scope.showForm = true;
                $scope.editSoldMode = true;
                $scope.postData = {
                    id: asset.id,
                    note: asset.note,
                    amount: +asset.amount,
                    transaction_date: asset.transaction_date,
                    price: +asset.sell_price,
                    currency: asset.currency,
                    purchase_price: asset.purchase_price,
                    price_type: asset.price_type,
                    coin: $scope.coins.find((coin) => {
                        return coin.Symbol === asset.symbol
                    })
                };
            }

            $scope.sellAnAsset = (asset) => {
                $scope.sellMode = true;
                $scope.showForm = true;
                $scope.postData = {
                    id: asset.id,
                    note: '',
                    amount: undefined,
                    transaction_date: '',
                    price: undefined,
                    currency: 'USD',
                    price_type: 'perUnit',
                    purchase_price: asset.purchase_price,
                    buy_price: asset.buy_price,
                    coin: $scope.coins.find((coin) => {
                        return coin.Symbol === asset.symbol
                    })
                };
            }

            $scope.addAnAsset = () => {
                $scope.showForm = true;
                $scope.addMode = true;
            }

            $scope.cancelEditAsset = () => {
                $scope.editSoldMode = false;
                $scope.showForm = false;
                $scope.editMode = false;
                $scope.addMode = false;
                $scope.sellMode = false;
                $scope.postData = { coin: {} };
            }

            $scope.getAssets = () => {
                // Utill.startLoader();
                Request.get('assets/').then((res) => {
                    $scope.assets = res.data;
                    $scope.getCoinPrices();
                    Utill.endLoader();
                }, (res) => {
                    Utill.endLoader();
                });
            }

            $scope.getSoldAssets = () => {
                Utill.startLoader();
                Request.get('sell-assets/').then((res) => {
                    $scope.soldAssets = res.data;
                    $scope.getSoldCoinPrices();
                    Utill.endLoader();
                }, (res) => {
                    Utill.endLoader();
                });
            };

            $scope.getAssetsData = () => {
                // Utill.startLoader();                
                $scope.assets.forEach(function(val, idx) {
                    if(val.price_type === 'totalValue') {
                        val.amount = (+val.amount / +val.buy_price);                    
                    }

                    val.market_price = $scope.coinPrices[val.symbol].USD;
                    val.total_value = +val.amount * val.market_price; 
                    val.buy_priceUSD =  val.purchase_price;   
                    val.profit_loss_pct = ((val.total_value - val.buy_priceUSD) / val.buy_priceUSD) * 100;
                    val.profit_loss_amt = (val.buy_priceUSD /100 )  * val.profit_loss_pct; 

                    if (idx === $scope.assets.length - 1) {
                        $timeout(function () {
                            $scope.getAssets();
                        }, 100000)
                    }
                });

                $scope.$watchCollection('assets', function (nAssets, oAssets) {
                    $scope.assets = nAssets;
                });
                Utill.endLoader();                
                
            }

            $scope.getSoldAssetsData = () => {
                $scope.soldAssets.forEach(function (val, idx) {
                    var b = 0, c = 0 , d = 0;

                    if (val.price_type === 'totalValue') {
                        val.amount = (+val.amount / +val.buy_price);
                    }
                    val.market_price = $scope.soldCoinPrices[val.symbol].USD;

                    if(val.currency === 'USD'){
                        val.sell_priceUSD = val.purchase_price;
                        val.total_value = val.amount * val.sell_price;

                    } else {
                        val.sell_price = val.sell_price * $scope.soldCurrencyUSDPrices[val.currency].USD;
                        val.buy_price = val.buy_price * $scope.soldCurrencyUSDPrices[val.currency].USD;
                        val.total_value = val.amount * val.sell_price;
                    }

                    b = val.amount * val.buy_price;
                    val.profit_loss_amt = val.total_value - b;

                    c = val.sell_price - val.buy_price;
                    d = c / val.buy_price;
                    val.profit_loss_pct = d * 100;

                });

                $scope.$watchCollection('soldAssets', function (nsoldAssets, osoldAssets) {
                    $scope.soldAssets = nsoldAssets;
                });
            }

            $scope.getCoinPrices = () => {
                // Utill.startLoader();                
                var coinSymbols = Array.from(new Set($scope.assets.map((data) => data.symbol))).join(',')
                CorsRequest.get(`data/pricemulti?fsyms=${coinSymbols}&tsyms=BTC,USD,ETH,LTC,EUR`).then(function (res) {
                    $scope.coinPrices = res.data;
                    $scope.getCurrencyUSDPrices();                    
                    Utill.endLoader();
                }, function (res) {
                    console.log(res)
                    Utill.endLoader();
                })
            }

            $scope.getSoldCoinPrices = () => {
                // Utill.startLoader();                
                var coinSymbols = Array.from(new Set($scope.soldAssets.map((data) => data.symbol))).join(',')
                CorsRequest.get(`data/pricemulti?fsyms=${coinSymbols}&tsyms=BTC,USD,ETH,LTC,EUR`).then(function (res) {
                    $scope.soldCoinPrices = res.data;
                    $scope.getSoldCurrencyUSDPrices();
                    Utill.endLoader();
                }, function (res) {
                    console.log(res)
                    Utill.endLoader();
                })
            }

            $scope.getCurrencyUSDPrices = () => {
                // Utill.startLoader();                
                CorsRequest.get('data/pricemulti?fsyms=BTC,LTC,ETH,USD,EUR&tsyms=BTC,LTC,ETH,USD,EUR').then(function (res) {
                    $scope.currencyUSDPrices = res.data;
                    $scope.getAssetsData(); 
                    Utill.endLoader();
                }, function (res) {
                    console.log(res)
                    Utill.endLoader();
                })
            }

            $scope.getSoldCurrencyUSDPrices = () => {
                // Utill.startLoader();                
                CorsRequest.get('data/pricemulti?fsyms=BTC,LTC,ETH,USD,EUR&tsyms=BTC,LTC,ETH,USD,EUR').then(function (res) {
                    $scope.soldCurrencyUSDPrices = res.data;
                    $scope.getSoldAssetsData();
                    Utill.endLoader();
                }, function (res) {
                    console.log(res)
                    Utill.endLoader();
                })
            }

            $scope.getCoins = () => {
                Utill.startLoader();
                CorsRequest.get('data/all/coinlist').then(
                    (res) => {
                        $scope.baseUrl = res.data.BaseImageUrl;
                        var obj = res.data.Data
                        $scope.coins = Object.keys(obj).map(key => obj[key]);
                        Utill.endLoader();
                    },
                    (res) => {
                        $scope.errors = res.data;
                        Utill.endLoader();
                    })
            }

            $scope.reloadAsset = () => {
                $scope.getAssets();                
            }

            $scope.reloadSoldAsset = () => {
                $scope.getSoldAssets();
            }

            // $scope.getAssetsTicks = () => {
            //     $scope.interval_a = $interval(function () {
            //         $scope.getAssets();
            //     }, 90000)
            // };     
            
            // $scope.getSoldAssetsTicks = () => {
            //     $scope.interval_b = $interval(function () {
            //         $scope.getSoldAssets();
            //     }, 90000)
            // };     

            $scope.$on("$destroy", function () {
                if (angular.isDefined($scope.interval_a)) {
                    $interval.cancel($scope.interval_a);
                }

                if (angular.isDefined($scope.interval_b)) {
                    $interval.cancel($scope.interval_b);
                }
            });

            $scope.resetData();
            $scope.getCoins();
            $scope.getAssets();
            $scope.getSoldAssets();
        }]);