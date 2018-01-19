app.controller('DashCtrl',
    ['$scope', '$stateParams', '$state', '$interval', '$rootScope', 'UserService', 'Request', 'CorsRequest', '$localStorage', 'Utill', '$q',
        function ($scope, $stateParams, $state, $interval, $rootScope, UserService, Request, CorsRequest, $localStorage, Utill, $q) {

            $scope.postData = {};
            $scope.errors = [];
            $scope.coinPrices = []
            $scope.showLoader = false;
            $scope.showPhoneForm = false;
            $scope.depositsTotal = 0;
            $scope.histogram = { data: [], xaxis: [] };
            $scope.loadingData = false;
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

            $scope.drawChart = function(dataSets, minPeriod) {
                var chart = AmCharts.makeChart( "chart-user", {
                    "type": "stock",
                    "hideCredits":true,

                    "theme": "light",  
                    "dataSets": dataSets,

                    "panels": [ {
                        "title": "Value",
                        "stockGraphs": [ {
                            "id": "g1",
                            "valueField": "value",
                            "comparable": true,
                            "compareField": "value",
                            "balloonText": "[[title]]:<b>[[value]]</b>",
                            "compareGraphBalloonText": "[[title]]:<b>[[value]]</b>"
                        } ],
                        "stockLegend": {
                            "valueTextRegular": " ",
                            "markerType": "none",
                            "periodValueTextComparing": "[[percents.value.close]]%",
                            "periodValueTextRegular": "[[value.close]]"
                        },

                        "valueAxes": [ {
                            "id": "v1",
                            "dashLength": 5
                        } ],

                        "categoryAxis": {
                            "dashLength": 5
                        },
                    },],

                    "chartScrollbarSettings": {
                        "graph": "g1",
                        "graphType": "line",
                        "usePeriod": "WW"
                    },


                    "chartCursorSettings": {
                        "valueBalloonsEnabled": true,
                        "graphBulletSize": 1,
                        "valueLineBalloonEnabled": true,
                        "valueLineEnabled": true,
                        "valueLineAlpha": 0.5
                    },

                    "categoryAxesSettings": {
                        "minPeriod": minPeriod,
                        "equalSpacing": true,
                        "startOnAxis": true
                    },

                      "dataSetSelector": {
                        "position": "top"
                      },


                    "export": {
                    "enabled": true
                    },
                } );
                chart.validateData();
            }



            $scope.generateDataSetsForHistory = function () {
                var dataSets = [];
                var data = {};
                $scope.rawChartData.map(function(item){
                    if(item.Response == 'Error')
                        return;
                    if(!data[item.asset])
                        data[item.asset] = [];
                    data[item.asset].push({
                        "date": new Date(+item.ts * 1000),
                        "value": item[item.asset].USD,
                        "volume": Math.round( Math.random() * 22 )
                    });
                    
                })
                
                for (key in data){
                    var temp = data[key].sort(function(t1, t2){
                        return t1.date > t2.date;
                    })
                    dataSets.push({
                        "fieldMappings": [ {
                          "fromField": "value",
                          "toField": "value"
                        }, {
                          "fromField": "volume",
                          "toField": "volume"
                        } ],

                        "dataProvider": data[key],
                        "categoryField": "date",
                        "title": key,
                        "compared": false,
                        "showInCompare": false,
                    })
                }
                return dataSets;
            }

            $scope.generateDataSets = function() {
                var dataSets = [];
                chartData = $scope.rawChartData.map(function(item){
                    var chartData = [];
                    chartData = item.Data.map(function(item){
                        return {
                            // "date": moment(item.time).format('YY-MM-DD HH-MM-SS'),
                            "date": new Date(+item.time *1000),
                            "value": item.close,
                            "volume": Math.round( Math.random() * 22 )
                        };
                    });

                    return {
                        "fieldMappings": [ {
                          "fromField": "value",
                          "toField": "value"
                        }, {
                          "fromField": "volume",
                          "toField": "volume"
                        } ],

                        "dataProvider": chartData,
                        "categoryField": "date",
                        "title": item.asset,
                        "compared": false,
                        "showInCompare": false,
                    }
                })
                return chartData;
            }
    

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
                // Utill.startLoader();
                // $scope.loadingData = true;
                // var coinSymbols = $scope.assets.map((data) => data.symbol);
                
                // var promises = [];
                // coinSymbols.map(function(symbol){
                //     for (var d = 1; d <= 30; d ++ ){
                //         var date = moment().subtract('day', d).unix();
                //         promises.push(CorsRequest.get(`data/pricehistorical?fsym=${symbol}&tsyms=USD&ts=${Math.round(date)}`));    
                //     }
                    
                // });
                // $q.all(promises).then(function(res){
                    
                //     $scope.loadingData = false;
                //     $scope.rawChartData = res.map(function(r){ 
                //         var assetname = r.config.url;
                //         assetname = assetname.slice(assetname.indexOf('fsym'));
                //         assetname = assetname.slice(0, assetname.indexOf('&'));
                //         assetname = assetname.slice(5);
                //         var ts = r.config.url;
                //         ts = ts.slice(ts.indexOf('&ts='));
                //         ts = ts.slice(4);
                //         return {...r.data, asset: assetname, ts: ts}; 
                //     });
                //     var dataSets = $scope.generateDataSetsForHistory();
                //     $scope.drawChart(dataSets, 'DD');
                //     Utill.endLoader()
                // }, (res) => {
                //     console.log('error', res);
                // })

                $scope.loadingData = true;
                var coinSymbols = $scope.getUniqueAssets();
                
                $q.all(coinSymbols.map(function(symbol){
                    return CorsRequest.get(`data/histohour?fsym=${symbol}&tsym=USD&limit=700`);    
                })).then(function(res){
                    
                    $scope.loadingData = false;
                    $scope.rawChartData = res.map(function(r){ 
                        var assetname = r.config.url;
                        assetname = assetname.slice(assetname.indexOf('fsym'));
                        assetname = assetname.slice(0, assetname.indexOf('&'));
                        assetname = assetname.slice(5);
                        return {...r.data, asset: assetname}; 
                    });

                    var dataSets = $scope.generateDataSets();
                    $scope.drawChart(dataSets, 'ss');

                    // $scope.histogram.data = $scope.calcPerformance(res.data.Data);                    
                    // $scope.histogram.xaxis = $scope.getxAxis($scope.histogram.data, 'HH:mm');
                    // $scope.$watchCollection('histogram', function (nData, oData) {
                    //     $scope.histogram = nData;
                    // });
                    Utill.endLoader();
                }, (res) => {
                    console.log('error', res);
                    Utill.endLoader();
                })
            };


            $scope.getHistoryWeek = () => {
                // Utill.startLoader();
                // $scope.loadingData = true;
                // var coinSymbols = $scope.assets.map((data) => data.symbol);
                
                // var promises = [];
                // coinSymbols.map(function(symbol){
                //     for (var d = 1; d <= 7; d ++ ){
                //         var date = moment().subtract('day', d).unix();
                //         promises.push(CorsRequest.get(`data/pricehistorical?fsym=${symbol}&tsyms=USD&ts=${Math.round(date)}`));    
                //     }
                    
                // });
                // $q.all(promises).then(function(res){
                    
                //     $scope.loadingData = false;
                //     $scope.rawChartData = res.map(function(r){ 
                //         var assetname = r.config.url;
                //         assetname = assetname.slice(assetname.indexOf('fsym'));
                //         assetname = assetname.slice(0, assetname.indexOf('&'));
                //         assetname = assetname.slice(5);
                //         var ts = r.config.url;
                //         ts = ts.slice(ts.indexOf('&ts='));
                //         ts = ts.slice(4);
                //         return {...r.data, asset: assetname, ts: ts}; 
                //     });
                //     var dataSets = $scope.generateDataSetsForHistory();
                //     $scope.drawChart(dataSets, 'DD');
                //     Utill.endLoader()
                // }, (res) => {
                //     console.log('error', res);
                // })
                $scope.loadingData = true;
                var coinSymbols = $scope.getUniqueAssets();
                
                $q.all(coinSymbols.map(function(symbol){
                    return CorsRequest.get(`data/histohour?fsym=${symbol}&tsym=USD&limit=150`);    
                })).then(function(res){
                    
                    $scope.loadingData = false;
                    $scope.rawChartData = res.map(function(r){ 
                        var assetname = r.config.url;
                        assetname = assetname.slice(assetname.indexOf('fsym'));
                        assetname = assetname.slice(0, assetname.indexOf('&'));
                        assetname = assetname.slice(5);
                        return {...r.data, asset: assetname}; 
                    });

                    var dataSets = $scope.generateDataSets();
                    $scope.drawChart(dataSets, 'ss');

                    // $scope.histogram.data = $scope.calcPerformance(res.data.Data);                    
                    // $scope.histogram.xaxis = $scope.getxAxis($scope.histogram.data, 'HH:mm');
                    // $scope.$watchCollection('histogram', function (nData, oData) {
                    //     $scope.histogram = nData;
                    // });
                    Utill.endLoader();
                }, (res) => {
                    console.log('error', res);
                    Utill.endLoader();
                })
            };

            $scope.getHistoryDay = () => {

                CorsRequest.get(`data/histominute?fsym=BTC&tsym=USD&limit=300`)
                .then(function(res){

                    $scope.histogram.data = $scope.calcPerformance(res.data.Data);
                    $scope.histogram.xaxis = $scope.getxAxis($scope.histogram.data, 'HH:mm');
                    $scope.$watchCollection('histogram', function (nData, oData) {
                        $scope.histogram = nData;
                    });
                });

                
                // Utill.startLoader();
                $scope.loadingData = true;
                var coinSymbols = $scope.getUniqueAssets();
                
                $q.all(coinSymbols.map(function(symbol){
                    return CorsRequest.get(`data/histohour?fsym=${symbol}&tsym=USD&limit=24`);    
                })).then(function(res){
                    
                    $scope.loadingData = false;
                    $scope.rawChartData = res.map(function(r){ 
                        var assetname = r.config.url;
                        assetname = assetname.slice(assetname.indexOf('fsym'));
                        assetname = assetname.slice(0, assetname.indexOf('&'));
                        assetname = assetname.slice(5);
                        return {...r.data, asset: assetname}; 
                    });

                    var dataSets = $scope.generateDataSets();
                    $scope.drawChart(dataSets, 'ss');

                    // $scope.histogram.data = $scope.calcPerformance(res.data.Data);                    
                    // $scope.histogram.xaxis = $scope.getxAxis($scope.histogram.data, 'HH:mm');
                    // $scope.$watchCollection('histogram', function (nData, oData) {
                    //     $scope.histogram = nData;
                    // });
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

            $scope.getUniqueAssets = () => {
                function onlyUnique(value, index, self) { 
                    return self.indexOf(value) === index;
                }
                return $scope.assets.map(a=>a.symbol).filter( onlyUnique ); // returns ['a', 1, 2, '1']
            };

            $scope.getAssets = () => {
                Utill.startLoader();
                Request.get('assets/').then((res) => {
                    if (res.data.length === 0) {
                        Utill.endLoader();
                        return 0;
                    };
                    $scope.initDepositDate = moment(res.data[res.data.length - 1].transaction_date);
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