app.controller('DashCtrl',
    ['$scope', '$stateParams', '$state', '$interval', '$rootScope', 'UserService', 'Request', 'CorsRequest', '$localStorage', 'Utill', '$q',
        function ($scope, $stateParams, $state, $interval, $rootScope, UserService, Request, CorsRequest, $localStorage, Utill, $q) {

            $scope.loadingData = false;
            $scope.price_param = {
                coin: 'BTC',
                period: 24      // day
            };

            $scope.coins = ['BTC'];

            CorsRequest.get(`data/all/coinlist`).then(function (res) {
                var coinlist = [];
                for (var coin in res.data.Data) {
                    coinlist.push(res.data.Data[coin].Symbol);
                }
            
                $scope.coins = coinlist;
            });

            $scope.drawChart = function(dataSets, minPeriod) {
                var chart = AmCharts.makeChart( "chart-user", {
                    "type": "stock",
                    "hideCredits": true,

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

                    "export": {
                        "enabled": true
                    },
                } );
                chart.validateData();
            }

            $scope.generateDataSets = function() {
                var dataSets = [];
                chartData = $scope.rawChartData.map(function(item) {
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
                        "title": item.asset
                    }
                })
                return chartData;
            }

            $scope.drawPriceHistory = () => {
                $scope.loadingData = true;
                CorsRequest.get(`data/histohour?fsym=${$scope.price_param.coin}&tsym=USD&limit=${$scope.price_param.period}`).then(function (r) {
                        $scope.loadingData = false;
                        var assetname = r.config.url;
                        assetname = assetname.slice(assetname.indexOf('fsym'));
                        assetname = assetname.slice(0, assetname.indexOf('&'));
                        assetname = assetname.slice(5);

                        $scope.rawChartData = [{...r.data, asset: assetname}]; 
                        var dataSets = $scope.generateDataSets();
                        $scope.drawChart(dataSets, 'ss');

                        Utill.endLoader();
                    }
                );
            };

            $scope.drawPriceHistory();

            $scope.$on("$destroy", function () {
                if (angular.isDefined($scope.interval)) {
                    $interval.cancel($scope.interval);
                }
            });
        }]);

app.controller('WithPromiseCtrl', WithPromiseCtrl);

function WithPromiseCtrl(DTOptionsBuilder, DTColumnBuilder, $http, $q) {
    var vm = this;
    vm.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        $http.get('/src/api/datatable.json').then(function(result) {
            defer.resolve(result.data);
        });
        return defer.promise;
    }).withPaginationType('full_numbers');

    vm.dtColumns = [
        DTColumnBuilder.newColumn('engine', 'Rank').renderWith(function(data, type, full) {
            return '<a href="/aaa" style="color: blue;">'+full.engine + ' ' + full.browser+'</a>';
        }),
        DTColumnBuilder.newColumn('browser').withTitle('Name (symbol)'),
        DTColumnBuilder.newColumn('platform').withTitle('Coin Name'),
        DTColumnBuilder.newColumn('version', 'Current Price').renderWith(function(data, type, full) {
            if (full.version == '-') {
                return '-'
            } else {
                var version = parseFloat(full.version);
                if (version > 50) {
                    return '<span style="color: green;">' + full.version + '</span>';
                } else {
                    return '<span style="color: red;">' + full.version + '</span>';
                }
            }
        }),
        DTColumnBuilder.newColumn('engine').withTitle('Market Cap'),
        DTColumnBuilder.newColumn('grade').withTitle('Volume'),
        DTColumnBuilder.newColumn('grade').withTitle('Price Change vs. Prior Period'),
        DTColumnBuilder.newColumn('grade').withTitle('Start Date'),
        DTColumnBuilder.newColumn('grade').withTitle('Discussion Links'),
        DTColumnBuilder.newColumn('grade').withTitle('Affiliate Links'),
        DTColumnBuilder.newColumn('grade').withTitle('Google Search Volume')
    ];
}
