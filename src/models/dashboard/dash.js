app.controller('DashCtrl', function ($scope, $stateParams, $state, $interval, $rootScope, UserService, Request, CorsRequest, $localStorage, Utill, $q, DTOptionsBuilder, DTColumnBuilder) {
    $scope.loadingData = false;
    $scope.price_param = {
        coin: 'BTC',
        period: 24      // day
    };

    $scope.symbol_list = ['BTC'];

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

    $scope.generateDataSets = function(rawChartData) {
        var dataSets = [];
        chartData = rawChartData.map(function(item) {
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
                "title": $scope.price_param.coin
            }
        })
        return chartData;
    }

    $scope.drawPriceHistory = () => {
        $scope.loadingData = true;
        CorsRequest.get(`data/histohour?fsym=${$scope.price_param.coin}&tsym=USD&limit=${$scope.price_param.period}`).then(function (r) {
            $scope.loadingData = false;
            $scope.change = r.data.Data[$scope.price_param.period].close - r.data.Data[0].close;

            var dataSets = $scope.generateDataSets([{...r.data}]);
            $scope.drawChart(dataSets, 'ss');

            Utill.endLoader();
        });
    };

    $scope.drawPriceHistory();

    $scope.$on("$destroy", function () {
        if (angular.isDefined($scope.interval)) {
            $interval.cancel($scope.interval);
        }
    });

    $scope.dtInstance = {};

    $scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        CorsRequest.get('data/all/coinlist').then(function(result) {
            $scope.coins = result.data.Data;
            $scope.symbol_list = Object.keys($scope.coins);

            $scope.coinlist = [];
            for (var coin in $scope.coins) {                
                $scope.coins[coin].current_price = '-';
                $scope.coins[coin].search_vol = '-';
                $scope.coins[coin].start_date = '-';
                $scope.coins[coin].affiliate = '-';
                $scope.coins[coin].market_cap = '-';
                $scope.coins[coin].volumedayto = '-';
                $scope.coins[coin].change24hour = '-';
                $scope.coins[coin].supply = '-';

                $scope.coinlist.push($scope.coins[coin]);
            }

            defer.resolve($scope.coinlist);
        });
        return defer.promise;
    }).withLanguage({
        "oPaginate": {
            "sNext":     '<i class="fa fa-chevron-right" aria-hidden="true"></i>',
            "sPrevious": '<i class="fa fa-chevron-left" aria-hidden="true"></i>'
        }
    }).withOption('drawCallback', function(settings) {
        // console.log(settings.nTBody.children);
        var sym_arr = [],
            cid_arr = [];
        for (i=0; i < settings.nTBody.children.length; i++) {
            var url = settings.nTBody.children[i].children[1].children[0].attributes[0].value,
                name = settings.nTBody.children[i].children[1].children[0].attributes[1].value,
                symbol = settings.nTBody.children[i].children[3].children[0].attributes[1].value,
                cid = settings.nTBody.children[i].children[4].children[0].attributes[1].value;

            if ($scope.coins[symbol].current_price == '-') {
                settings.nTBody.children[i].children[1].children[0].innerHTML = '<img width=24 style="margin-right:5px;" src="https://www.cryptocompare.com'+url+'">'+name;                
                sym_arr.push(symbol);                
                cid_arr.push(cid);
            }
        }

        sym_arr = sym_arr.join(',');
        if (!sym_arr) return;

        for (i=0; i<cid_arr.length; i++) {
            var cid = cid_arr[i];
            CorsRequest.get(`https://www.cryptocompare.com/api/data/coinsnapshotfullbyid/?id=${cid}`, true).then(function(result) {
                var coin = result.data.Data.General.Symbol;
                
                $scope.coins[coin].affiliate = result.data.Data.General.AffiliateUrl;
                $scope.coins[coin].start_date = result.data.Data.General.StartDate;

                angular.element('.affiliate-'+coin).html('<a target="_blank" style="color: blue;" href="'+$scope.coins[coin].affiliate+'">'+$scope.coins[coin].affiliate+'</a>');
                angular.element('.start-date-'+coin).html($scope.coins[coin].start_date);
            }, function(err) {
                console.log('########');
                console.log(err);
            });
        }

        CorsRequest.get(`data/pricemultifull?fsyms=${sym_arr}&tsyms=USD`).then(function(result) {
            for (var coin in result.data.DISPLAY) {
                $scope.coins[coin].current_price = result.data.DISPLAY[coin].USD.PRICE;
                $scope.coins[coin].market_cap = result.data.DISPLAY[coin].USD.MKTCAP;
                $scope.coins[coin].volumedayto = result.data.DISPLAY[coin].USD.VOLUMEDAYTO;
                $scope.coins[coin].supply = result.data.DISPLAY[coin].USD.SUPPLY;
                $scope.coins[coin].change24hour = result.data.DISPLAY[coin].USD.CHANGE24HOUR;

                angular.element('.current-price-'+coin).html($scope.coins[coin].current_price);
                angular.element('.market-cap-'+coin).html($scope.coins[coin].market_cap);
                angular.element('.volumedayto-'+coin).html($scope.coins[coin].volumedayto);
                angular.element('.supply-'+coin).html($scope.coins[coin].supply);

                var price_change = $scope.coins[coin].change24hour;
                angular.element('.change24hour-'+coin).html(price_change);
                if (price_change.indexOf('-') > -1) {
                    angular.element('.change24hour-'+coin).addClass('text-danger');
                } else {
                    angular.element('.change24hour-'+coin).addClass('text-success');
                }
            }
        });        
    }).withOption('lengthMenu', [10, 25, 50]).withOption('rowCallback', rowCallback);

    $scope.dtColumns = [
        DTColumnBuilder.newColumn('SortOrder', 'Rank'),
        DTColumnBuilder.newColumn('Name').withTitle('Name (symbol)').renderWith(function(data, type, full) {
            return `<span url="${full.ImageUrl}" symbol="${full.Name}">-</span>`;
        }).withOption('type', 'string'),
        DTColumnBuilder.newColumn('FullName').withTitle('Coin Name'),
        DTColumnBuilder.newColumn('current_price', 'Current Price').renderWith(function(data, type, full) {
            return `<span class="current-price-${full.Symbol}" symbol="${full.Symbol}">-</span>`;
        }),
        DTColumnBuilder.newColumn('market_cap').withTitle('Market Cap').renderWith(function(data, type, full) {
            return `<span class="market-cap-${full.Symbol}" cid="${full.Id}">-</span>`;
        }).withOption('type', 'num-fmt'),
        DTColumnBuilder.newColumn('volumedayto').withTitle('VOLUMEDAYTO').renderWith(function(data, type, full) {
            return `<span class="volumedayto-${full.Symbol}" symbol="${full.Symbol}">-</span>`;
        }),
        DTColumnBuilder.newColumn('change24hour').withTitle('CHANGE24HOUR').renderWith(function(data, type, full) {
            return `<span class="change24hour-${full.Symbol}" symbol="${full.Symbol}">-</span>`;
        }),
        DTColumnBuilder.newColumn('supply').withTitle('SUPPLY').renderWith(function(data, type, full) {
            return `<span class="supply-${full.Symbol}" symbol="${full.Symbol}">-</span>`;
        }),
        DTColumnBuilder.newColumn('TotalCoinSupply', 'TotalCoinSupply').withOption('type', 'num-fmt'),
        DTColumnBuilder.newColumn('start_date').withTitle('Start Date').renderWith(function(data, type, full) {
            return `<span class="start-date-${full.Symbol}" symbol="${full.Symbol}">-</span>`;
        }),
        DTColumnBuilder.newColumn('affiliate').withTitle('Website').renderWith(function(data, type, full) {
            return `<span class="affiliate-${full.Symbol}" symbol="${full.Symbol}">-</span>`;
        }),
        DTColumnBuilder.newColumn('search_vol').withTitle('Google Search Volume'),
        DTColumnBuilder.newColumn('search_vol').withTitle('Search Volume Change'),
        DTColumnBuilder.newColumn('search_vol').withTitle('Search Volume Change %'),
        DTColumnBuilder.newColumn('search_vol').withTitle('Discussion Link')
    ];

    $scope.someClickHandler = someClickHandler;

    function someClickHandler(info) {
        $scope.price_param.coin = info.Symbol;
        $scope.drawPriceHistory();
    }

    function rowCallback(nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        // Unbind first in order to avoid any duplicate handler (see https://github.com/l-lin/angular-datatables/issues/87)
        $('td', nRow).unbind('click');
        $('td', nRow).bind('click', function() {
            $scope.$apply(function() {
                $scope.someClickHandler(aData);
            });
        });
        return nRow;
    }    
});
