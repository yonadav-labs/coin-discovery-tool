app.controller('DashCtrl', function ($scope, $stateParams, $state, $interval, $rootScope, UserService, Request, CorsRequest, $localStorage, Utill, $q, DTOptionsBuilder, DTColumnBuilder) {
    $scope.loadingData = false;
    $scope.price_param = {
        coin: 'BTC',
        period: 24,      // day
        custom: ''
    };

    $scope.symbol_list = ['BTC'];

    $scope.drawChart = function(dataSets, minPeriod, holder) {
        var chart = AmCharts.makeChart( holder, {
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

            "dataDateFormat": "YYYY-MM-DD HH:NN:SS"
        } );
        chart.validateData();
    }

    $scope.generateDataSets = function(rawChartData) {
        var dataSets = [];
        chartData = rawChartData.map(function(item) {
            var chartData = [];
            chartData = item.Data.map(function(item){
                var d = new Date();
                return {
                    // "date": moment(item.time).format('YY-MM-DD HH-MM-SS'),
                    "date": new Date(+item.time *1000 + d.getTimezoneOffset()*60*1000),
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

    $scope.generateDataSetsSearch = function(rawChartData, title) {        
        return [{
            "color": "blue",
            "fieldMappings": [ {
              "fromField": "value",
              "toField": "value"
            }, {
              "fromField": "volume",
              "toField": "volume"
            } ],

            "dataProvider": rawChartData,
            "categoryField": "date",
            "title": title
        }];
    }

    function drawPriceHistory(r) {
        $scope.loadingData = false;
        if (r.data.Data.length != 0) {
            $scope.change = r.data.Data[$scope.price_param.period].close - r.data.Data[0].close;
            $scope.change_pro = ($scope.change * 100 / r.data.Data[$scope.price_param.period].close).toFixed(2);            
        } else {
            $scope.change = '-';
            $scope.change_pro = '-';
        }

        var dataSets = $scope.generateDataSets([r.data]);
        $scope.drawChart(dataSets, 'ss', "chart-user");
    }

    function drawSearchTrend(r) {
        $scope.search_change = (r.data[r.data.length-1].value - r.data[0].value) + ' %';

        var dataSets = $scope.generateDataSetsSearch(r.data, $scope.price_param.coin);
        $scope.drawChart(dataSets, 'ss', 'chart-search');
    }

    function getSearchChange(data) {
        var res = 0
        for(i = 1; i < data.length / 2; i++) 
            res = res + (data[data.length-i].value - data[i].value);

        return res;
    }

    $scope.drawTrends = () => {
        $scope.loadingData = true;
        var url = `data/histohour?fsym=${$scope.price_param.coin}&tsym=USD&limit=${$scope.price_param.period}`;
        if ([90, 180, 365].indexOf($scope.price_param.period) > -1) 
            url = `data/histoday?fsym=${$scope.price_param.coin}&tsym=USD&limit=${$scope.price_param.period}`;

        CorsRequest.get(url).then(drawPriceHistory);
        Request.get(`getTrends/${$scope.price_param.coin}/${$scope.price_param.period}`).then(drawSearchTrend);
    };

    $scope.drawCustomTrends = () => {
        $scope.drawTrends();
        if ($scope.price_param.custom.trim()) {
            $scope.loadingData = true;
            Request.get(`getTrends/${$scope.price_param.custom}/${$scope.price_param.period}`).then(function(r) {
                $scope.loadingData = false;

                var dataSets = $scope.generateDataSetsSearch(r.data, $scope.price_param.custom);
                $scope.drawChart(dataSets, 'ss', 'chart-search-custom');            
            });            
        }
    };

    $scope.drawTrends();

    $scope.$on("$destroy", function () {
        if (angular.isDefined($scope.interval)) {
            $interval.cancel($scope.interval);
        }
    });

    $scope.formatNumber = function(num, prefix) {
        // console.log(num);
        if (!num)
            return '-';

        var suffix = '';
        if (num >= 1000000000) {
            num = num / 1000000000;
            suffix = 'B';
        } else if (num >= 1000000) {
            num = num / 1000000;
            suffix = 'M';
        }
        return prefix + ' ' + Number(num.toFixed(2)).toLocaleString() + ' ' + suffix;
    }

    $scope.dtInstance = {};

    $scope.dtOptions = DTOptionsBuilder.fromFnPromise(function() {
        var defer = $q.defer();
        Request.get('coins/').then(function(result) {
            $scope.coins = result.data;
            $scope.symbol_list = [];

            for(i = 0; i < result.data.length; i++) {
                $scope.symbol_list.push(result.data[i].symbol)                ;

                var tmp = $scope.coins[i].affiliateurl;
                if (tmp.indexOf('//') > -1) 
                    tmp = tmp.split('//')[1];                    
                if (tmp.indexOf('/') > -1) 
                    tmp = tmp.split('/')[0];
                $scope.coins[i].affiliateurl = tmp;                
            }

            defer.resolve($scope.coins);
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
            sym_arr_str,
            cid_arr = [];
        for (i = 0; i < settings.nTBody.children.length; i++) {
            var url = settings.nTBody.children[i].children[2].innerHTML;
            if (url.indexOf('img') < 0)
                settings.nTBody.children[i].children[2].innerHTML = '<img width=24 style="margin-right:5px;" src="https://www.cryptocompare.com'+url+'">';                
        }       
    }).withOption('lengthMenu', [10, 25, 50]).withOption('rowCallback', rowCallback).withOption('responsive', true);;

    $scope.dtColumns = [
        DTColumnBuilder.newColumn('sortorder', 'Rank'),
        DTColumnBuilder.newColumn('name', 'Name (symbol)'),
        DTColumnBuilder.newColumn('imageurl'),
        DTColumnBuilder.newColumn('fullname', 'Coin Name'),
        DTColumnBuilder.newColumn('price', 'Current Price').renderWith(function(data, type, full) {
            return $scope.formatNumber(full.price, '$')
        }).withOption('type', 'customtime'),
        DTColumnBuilder.newColumn('mktcap', 'MarketCap').renderWith(function(data, type, full) {
            return $scope.formatNumber(full.mktcap, '$')
        }).withOption('type', 'customtime'),
        DTColumnBuilder.newColumn('changepct24hour', '24h Price Change % (USD)').renderWith(function(data, type, full) {
            if (full.changepct24hour < 0) 
                return `<span class="text-danger">${$scope.formatNumber(full.changepct24hour, '')}</span>`;
            else 
                return `<span class="text-success">${$scope.formatNumber(full.changepct24hour, '')}</span>`;
        }).withOption('type', 'customtag'),
        DTColumnBuilder.newColumn('change24hour', '24h Price Change (USD)').renderWith(function(data, type, full) {
            if (full.change24hour < 0) 
                return `<span class="text-danger">${$scope.formatNumber(full.change24hour, '$')}</span>`;
            else 
                return `<span class="text-success">${$scope.formatNumber(full.change24hour, '$')}</span>`;
        }).withOption('type', 'customtag'),
        DTColumnBuilder.newColumn('supply', 'In Circulation').renderWith(function(data, type, full) {
            return $scope.formatNumber(full.supply, full.fromsymbol)
        }).withOption('type', 'customtime'),
        DTColumnBuilder.newColumn('totalcoinsupply', 'Max Supply').renderWith(function(data, type, full) {
            return $scope.formatNumber(full.totalcoinsupply, full.fromsymbol)
        }).withOption('type', 'customtime'),
        DTColumnBuilder.newColumn('startdate', 'Coin Launch Date'),
        DTColumnBuilder.newColumn('affiliateurl', 'Website').renderWith(function(data, type, full) {
            return `<a href="http://${full.affiliateurl}" style="color: blue;" target="_blank">${full.affiliateurl}</a>`;
        }),
        DTColumnBuilder.newColumn('affiliateurl', 'Buy / Sell').renderWith(function(data, type, full) {
            return `<a href="https://binance.com/?ref=25197090" style="color: blue;" target="_blank">Buy/Sell</a>`;
        })
    ];

    $scope.someClickHandler = someClickHandler;

    function someClickHandler(info) {
        $scope.price_param.coin = info.symbol;
        $scope.drawTrends();
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

jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "customtime-pre": function ( a ) {        
        if (a == '-') return 0;

        var val = a.trim().split(' ')[1],
            res;
        if (a.indexOf('M') > -1)
            res = +val * 1000000;
        else if (a.indexOf('B') > -1) 
            res = +val * 1000000000;
        else
            res = +(val.replace(',', ''));
        return res;
    },
 
    "customtime-asc": function ( a, b ) {
        return a - b;
    },
 
    "customtime-desc": function ( a, b ) {
        return b - a;
    }
} );

jQuery.extend( jQuery.fn.dataTableExt.oSort, {
    "customtag-pre": function ( a ) {        
        var val = a.split('>')[1].split('<')[0],
            res;
        
        if (val.indexOf(' ') > -1) val = val.split(' ')[1];
        res = +(val.replace(',', ''));
        return res;
    },
 
    "customtag-asc": function ( a, b ) {
        return a - b;
    },
 
    "customtag-desc": function ( a, b ) {
        return b - a;
    }
} );
