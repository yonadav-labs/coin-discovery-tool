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


            $scope.drawGrowthChart = function(growthData, minPeriod) {

                var chartData = [];

                for ( var i = 0; i < growthData.length; i++ ) {
                    chartData.push( {
                        "date": growthData[i].date,
                        "value": growthData[i].value,
                        "volume": growthData[i].value
                    } );
                }
                var stockEvents = [];
                var stockEvents = $scope.assets.map((data) => {
                    return {
                        "date": new Date(data.transaction_date),
                        "type": "sign",
                        "graph": "g1",
                        "text": data.symbol,
                        "description": "Invested $" + data.purchase_price + ' in ' + data.amount +' ' + data.symbol
                    }
                });
                var chart = AmCharts.makeChart( "chart-growth", {
                    "type": "stock",
                    "theme": "light",
                    "dataSets": [ {
                        "color": "#b0de09",
                        "fieldMappings": [ {
                            "fromField": "value",
                            "toField": "value"
                            }, {
                            "fromField": "volume",
                            "toField": "volume"
                        } ],
                        "dataProvider": chartData,
                        "categoryField": "date",
                        // EVENTS
                        "stockEvents": stockEvents
                    }],


                  "panels": [ {
                    "title": "Value",
                    "stockGraphs": [ {
                      "id": "g1",
                      "valueField": "value"
                    } ],
                    "stockLegend": {
                      "valueTextRegular": " ",
                      "markerType": "none"
                    }
                  } ],

                  "chartScrollbarSettings": {
                    "graph": "g1"
                  },

                  "chartCursorSettings": {
                    "valueBalloonsEnabled": true,
                    "graphBulletSize": 1,
                    "valueLineBalloonEnabled": true,
                    "valueLineEnabled": true,
                    "valueLineAlpha": 0.5
                  },

                  "periodSelector": {
                    "periods": [ {
                      "period": "DD",
                      "count": 10,
                      "label": "10 days"
                    }, {
                      "period": "MM",
                      "count": 1,
                      "label": "1 month"
                    }, {
                      "period": "YYYY",
                      "count": 1,
                      "label": "1 year"
                    }, {
                      "period": "YTD",
                      "label": "YTD"
                    }, {
                      "period": "MAX",
                      "label": "MAX"
                    } ]
                  },

                  "panelsSettings": {
                    "usePrefixes": true
                  },
                  "export": {
                    "enabled": true
                  }
                });
                chart.validateData();
            }


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

                    "listeners": [{
                            "event": "drawn",
                            "method": handleZoom
                        }, 
                        // {
                        //     "event": "dataUpdated",
                        //     "method": handleZoom
                        // }
                    ],
                    "export": {
                        "enabled": true
                    },
                } );
                chart.validateData();

                // chart.addListener("rendered", handleZoom);

                function handleZoom(event) {
                   console.log(event);
                }
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
                $scope.loadingData = true;
                $scope.getUniqueAssets().then(function(coinSymbols) {
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

                        Utill.endLoader();
                    }, (res) => {
                        console.log('error', res);
                        Utill.endLoader();
                    })
                });
                
            };


            $scope.getHistoryWeek = () => {
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

                    Utill.endLoader();
                }, (res) => {
                    console.log('error', res);
                    Utill.endLoader();
                })
            };

            $scope.getHistoryDay = () => {
                // $scope.getGrowsGraph();
                // Utill.startLoader();
                $scope.loadingData = true;
                $scope.getUniqueAssets().then(function(coinSymbols) {
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
                                        
                        Utill.endLoader();
                    }, (res) => {
                        console.log('error', res);
                        Utill.endLoader();
                    })
                });
                
            };

            $scope.getGrowsGraph = function() {

                var coinSymbols = $scope.getUniqueAssets();
                $q.all(coinSymbols.map(function(symbol){
                    return CorsRequest.get(`data/histoday?fsym=${symbol}&tsym=USD&limit=200`);    
                })).then(function(res){
                    
                    $scope.loadingData = false;
                    $scope.rawChartData = res.map(function(r){ 
                        var assetname = r.config.url;
                        assetname = assetname.slice(assetname.indexOf('fsym'));
                        assetname = assetname.slice(0, assetname.indexOf('&'));
                        assetname = assetname.slice(5);
                        return {...r.data, asset: assetname}; 
                    });

                    var priceByTime = {};
                    $scope.rawChartData.map((item) => {

                        item.Data.map((ii)=>{
                            if(!priceByTime[item.asset])
                                priceByTime[item.asset] = [];
                            priceByTime[item.asset].push({
                                time: moment.unix(ii.time).format('YYYY-MM-DD'),
                                high: ii.high,
                                low: ii.low,
                                open: ii.open,
                                close: ii.close,
                                volumefrom: ii.volumefrom,
                                volumeto: ii.volumeto
                            });                            
                        })
                    });

                    var growthData = [];
                    for( var i = 0 ; i < priceByTime[Object.keys(priceByTime)[0]].length; i++){
                        var time = priceByTime[Object.keys(priceByTime)[0]][i].time;
                        var initDepositDate = moment(time);
                        var thisDayAssets = $scope.assets.filter((asset)=>{
                            var timeDiff = moment(asset.transaction_date).isSameOrAfter(initDepositDate);
                            if (timeDiff) {
                                return false;
                            } else {
                                return true;
                            }
                        });
                        var dayTotal = 0;
                        thisDayAssets.forEach(function (val, idx) { 
                            market_price = priceByTime[val.symbol][i].close;
                            dayTotal += +val.amount * market_price; 
                        });

                        growthData.push({
                            date: time,
                            value: dayTotal
                        });
                    }
                    // $scope.drawGrowthChart(growthData, 'dd');
                });
            }
            

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
                return CorsRequest.get(`data/all/coinlist`).then(function (res) {
                    var coinlist = [];
                    for (var coin in res.data.Data) {
                        coinlist.push(res.data.Data[coin]);
                    }
                    return coinlist.sort(function(a, b) { return parseInt(a.SortOrder) - parseInt(b.SortOrder); }).map(a=>a.Symbol).slice(0, 10);
                });
            };

            $scope.getAssets = () => {
                Utill.startLoader();
                Request.get('assets/').then((res) => {
                    if (res.data.length === 0) {
                        Utill.endLoader();
                        return 0;
                    };
                    $scope.initDepositDate = moment(res.data[res.data.length - 1].transaction_date);

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