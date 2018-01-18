app.controller('DashCtrl',
    ['$scope', '$stateParams', '$state', '$interval', '$rootScope', 'UserService', 'Request', 'CorsRequest', '$localStorage', 'Utill',
        function ($scope, $stateParams, $state, $interval, $rootScope, UserService, Request, CorsRequest, $localStorage, Utill) {

            $scope.postData = {};
            $scope.errors = [];
            $scope.coinPrices = []
            $scope.showLoader = false;
            $scope.showPhoneForm = false;
            $scope.depositsTotal = 0;
            $scope.histogram = { data: [], xaxis: [] };

            $scope.pie = {
                labels: [],
                data: [],
                options: {
                    legend: {
                        display: true,
                        position: 'right',
                        labels: {
                            boxWidth: 12
                        }
                    },
                    tooltips: {
                        callbacks: {
                            label: function (tooltipItem, data) {
                                var allData = data.datasets[tooltipItem.datasetIndex].data;
                                var tooltipLabel = data.labels[tooltipItem.index];
                                var tooltipData = allData[tooltipItem.index];
                                var total = 0;
                                for (var i in allData) {
                                    total += allData[i];
                                }
                                var tooltipPercentage = Math.round((tooltipData / total) * 100);
                                return tooltipLabel + ': ' + tooltipData.toFixed(2) + ' (' + tooltipPercentage + '%)';
                            }
                        }
                    }
                }
            };

            $scope.periodFilter = (period) => {
                switch (period) {
                    case 'Day':
                        $scope.getHistoryDay();
                        break;
                    case 'Week':
                        $scope.getHistoryWeek();
                        break;
                    case 'Month':
                        $scope.getHistoryMonth();
                        break;
                    default:
                        $scope.getHistoryDay();
                        break;
                }
                $scope.period = period;
            };

            $scope.getHistoryMonth = () => {
                CorsRequest.get('data/histoday?fsym=BTC&tsym=USD').then((res) => {
                    $scope.histogram.data = $scope.calcPerformance(res.data.Data, $scope.totalAmtInBTC);                    
                    $scope.histogram.xaxis = $scope.getxAxis($scope.histogram.data, 'MMM DD');
                    $scope.$watchCollection('histogram', function (nData, oData) {
                        $scope.histogram = nData;
                    });
                    Utill.endLoader();
                }, (res) => {
                    console.log('error', res);
                })
            };


            $scope.getHistoryWeek = () => {
                CorsRequest.get('data/histoday?fsym=BTC&tsym=USD&limit=7').then((res) => {
                    $scope.histogram.data = $scope.calcPerformance(res.data.Data, $scope.totalAmtInBTC);                    
                    $scope.histogram.xaxis = $scope.getxAxis($scope.histogram.data, 'MMM DD');
                    $scope.$watchCollection('histogram', function (nData, oData) {
                        $scope.histogram = nData;
                    });
                    Utill.endLoader()
                }, (res) => {
                    console.log('error', res);
                })
            };

            $scope.getHistoryDay = () => {
                // Utill.startLoader();
                CorsRequest.get('data/histohour?fsym=BTC&tsym=USD&limit=23').then((res) => {
                    console.log(res.data)
                    $scope.histogram.data = $scope.calcPerformance(res.data.Data);                    
                    $scope.histogram.xaxis = $scope.getxAxis($scope.histogram.data, 'HH:mm');
                    $scope.$watchCollection('histogram', function (nData, oData) {
                        $scope.histogram = nData;
                    });
                    Utill.endLoader();
                }, (res) => {
                    console.log('error', res);
                    Utill.endLoader();
                })
            };

            
            $scope.calcPerformance = (data) => {
                var holding = 0;
                $scope.percentageDifference = 0;
                $scope.amountDifference = 0;
                return data.map(function (val, idx) {
                    var initDepositDate = moment.unix(val.time).format('YYYY-MM-DD');
                    var timeDiff = moment($scope.initDepositDate).isSameOrAfter(initDepositDate);
                    if (timeDiff) {
                        return [val.time, 0];
                    } else {
                        let d = val.close - val.open;
                        let pctDiff = (+d.toFixed(2) / val.open) * 100;
                        $scope.percentageDifference += +pctDiff.toFixed(2);
                        let amt = (+pctDiff.toFixed(2) / 100) * holding;
                        $scope.amountDifference += +amt.toFixed(2);
                        holding = +(holding + amt).toFixed(2);
                        return [val.time, holding];
                    }
                });
            };

            // $scope.calcPerformance = (data) => {
            //     $scope.percentageDifference = 0;
            //     $scope.amountDifference = 0;
            //     return data.map(function (data, idx) {
            //         var holding = 0;
            //         $scope.assets.forEach(function (asset, idx) {
            //             var date = moment.unix(data.time).format('YYYY-MM-DD HH:mm:ss');
            //             var isBetween = moment(asset.transaction_date).isBetween($scope.initTransactionDate, date, null, '[]');

            //             if (!isBetween) {
            //                 return holding += 0;
            //             } else {
            //                 var a = $scope.currencyUSDPrices[asset.symbol].BTC;
            //                 var b = $scope.currencyUSDPrices['BTC']['USD'];
            //                 return holding += a * b * asset.amount;
            //             }
            //         });

            //         let d = data.close - data.open;

            //         let pctDiff = (+d.toFixed(2) / data.open) * 100;

            //         $scope.percentageDifference += +pctDiff.toFixed(2);

            //         let amt = (+pctDiff.toFixed(2) / 100) * holding;

            //         $scope.amountDifference += +amt.toFixed(2);

            //         holding = +(holding + amt).toFixed(2);

            //         return [data.time, holding];
                    
            //     });
            // }

            $scope.getSummary = () => {
                $scope.holdings = 0;
                $scope.profitLossAmt = 0;
                $scope.profitLossPct = 0;

                $scope.assets.forEach(function (val, idx) { 
                    val.market_price = $scope.coinPrices[val.symbol].USD;
                    val.total_value = +val.amount * val.market_price; 
                    val.buy_priceUSD =  val.purchase_price;   
                    val.profit_loss_pct = ((val.total_value - val.buy_priceUSD) / val.buy_priceUSD) * 100;
                    val.profit_loss_amt = (val.buy_priceUSD /100 )  * val.profit_loss_pct; 
                    $scope.holdings += val.total_value;
                    $scope.depositsTotal += val.buy_priceUSD;
                    $scope.profitLossAmt += val.profit_loss_amt;
                    $scope.profitLossPct += val.profit_loss_pct;
                });
            };

            $scope.getxAxis = (data, dateFormat) => {
                return data.map(function (val) {
                    var d = moment.unix(val[0]).format(dateFormat)
                    if (d === '00:00') {
                        d = moment.unix(val[0]).format('MMM  DD')
                    }
                    return [val[0], d]
                })
            };

            $scope.getAssets = () => {
                Utill.startLoader();
                Request.get('assets/').then((res) => {
                    if (res.data.length === 0) {
                        Utill.endLoader();
                        return 0;
                    };
                    // $scope.initDepositDate = moment(res.data[res.data.length - 1].transaction_date).format('YYYY-MM-DD');
                    // $scope.depositsTotal = res.data.reduce((total, asset) => {
                    //     return +total + (+asset.amount * +asset.buy_price);
                    // }, 0);

                    var sortedData = res.data.sort(function (a, b) {
                        return a.transaction_date - b.transaction_date;
                    });

                    $scope.initTransactionDate = moment(sortedData[res.data.length - 1].transaction_date).format('YYYY-MM-DD HH:mm:ss');
                    $scope.assets = res.data;
                    $scope.pie.labels = Array.from(new Set(res.data.map((data) => data.name)));
                    $scope.getCoinPrices();
                    $scope.getAssetsTicks();
                    Utill.endLoader();
                }, (err) => {
                    console.log(err)
                    $scope.err = err.data;
                    Utill.endLoader();
                });
            };
            $scope.getAssets();
            
            $scope.getCoinPrices = () => {
                // Utill.startLoader();                
                var coinSymbols = Array.from(new Set($scope.assets.map((data) => data.symbol))).join(',')
                CorsRequest.get(`data/pricemulti?fsyms=${coinSymbols}&tsyms=BTC,USD,EUR`).then(function (res) {
                    $scope.coinPrices = res.data;
                    $scope.getCurrencyUSDPrices();
                    $scope.getPieData();
                    $scope.getSummary();
                    Utill.endLoader();
                }, function (res) {
                    console.log(res)
                    Utill.endLoader();                    
                })
            };

            $scope.getCurrencyUSDPrices = () => {
                // Utill.startLoader();                
                CorsRequest.get('data/pricemulti?fsyms=BTC,LTC,ETH,USD,EUR&tsyms=BTC,LTC,ETH,USD,EUR').then(function (res) {
                    $scope.currencyUSDPrices = res.data;
                    console.log()
                    $scope.totalAmtInBTC = 0;
                    $scope.assets.forEach(function (asset, idx) {
                         $scope.totalAmtInBTC += $scope.holding;
                        // $scope.totalAmtInBTC +=  $scope.currencyUSDPrices['BTC']['USD'] * asset.buy_p;
                        if (idx === $scope.assets.length - 1) {
                            $scope.getHistoryDay();
                            $scope.period = 'Day';
                        }
                    });
                    Utill.endLoader();
                }, function (res) {
                    console.log(res)
                    Utill.endLoader();
                })
            };

            $scope.getPieData = () => {
                $scope.pie.data = [];
                $scope.pie.labels.forEach((label) => {
                    var assetValue = $scope.assets.filter((a) => a.name === label).reduce((assetVal, val) => assetVal + (+val.amount * $scope.coinPrices[val.symbol].USD), 0);
                    $scope.pie.data.push(assetValue);
                });
            };

            $scope.reloadPerfomace = () => {
                $scope.getAssets();
            };
            
            $scope.getAssetsTicks = () => {
                // $scope.interval = $interval(function () {
                //     $scope.getCoinPrices();
                //     $scope.periodFilter($scope.period);
                // }, 90000)
            };

            $scope.$on("$destroy", function () {
                if (angular.isDefined($scope.interval)) {
                    $interval.cancel($scope.interval);
                }
            });

        }]);