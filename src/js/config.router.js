'use strict';

/**
 * Config for the router
 */
angular.module('app')
  .run(
    ['$rootScope', '$state', '$stateParams', 'UserService','$http',
      function ($rootScope,   $state,   $stateParams, UserService, $http){
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;

        // Idle.watch();

        // AppCtrl.$inject = ['ActivityMonitor'];
        //
        // function AppCtrl(ActivityMonitor) {
        //     // how long (in seconds) until user is considered inactive
        //     ActivityMonitor.options.inactive = 200;
        //
        //     ActivityMonitor.on('inactive', function() {
        //         alert("y0, you're inactive!");
        //     });
        // }


        $rootScope.currentUserToken = UserService.getCurrentUserToken();
        $rootScope.currentUser = UserService.getCurrentUser();
        
        if ($rootScope.currentUserToken ) {          

        }


        $rootScope.$on('$stateChangeStart', function (event, toState) {
            $rootScope.currentUserToken = UserService.getCurrentUserToken();
            $rootScope.currentUser = UserService.getCurrentUser();

            if (toState.data && toState.data.requiredLogin) {

                if (!$rootScope.currentUserToken) {
                    event.preventDefault();
                    // $window.location.href = '/';
                    $state.go('access.signin');
                }
            }
            else{
                if ($rootScope.currentUserToken) {
                    if (toState.name === "access.signin" || toState.name === "access.signup") {
                        event.preventDefault();
                        $state.go('app.dashboard');
                    }

                }
            }


        });
       }
    ]
  )
 
  .factory('ApiInterceptor', function($localStorage, $injector, $rootScope){

    console.log('here')
      return {
        request: function(config) {
          
          if($rootScope.currentUserToken){
            var UserService = $injector.get('UserService');

            if (config.url.indexOf(BASE_URL) > -1) {
              console.log('sign')
              config.headers['Authorization'] = 'JWT' + ' ' + UserService.getCurrentUserToken();

            }
          }
          // console.log(config)
          return config;
        },
          response: function(response) {
              // console.log(response.data);
              return response;
          }
      }

  })

  .config(function($httpProvider) {
    $httpProvider.interceptors.push('ApiInterceptor');
  })

  .config(
        ['$stateProvider', '$urlRouterProvider', 'JQ_CONFIG', 'MODULE_CONFIG', 
          function ($stateProvider,   $urlRouterProvider, JQ_CONFIG, MODULE_CONFIG) {
            var layout = "tpl/app.html";
            
            $urlRouterProvider
              .otherwise('/admin/dashboard');      

              $stateProvider
              .state('app', {
                  abstract: true,
                  url: '/admin',
                  templateUrl: layout
              })

              .state('app.dashboard', {
                  url: '/dashboard',
                  templateUrl: 'models/dashboard/dash.html',
                  data : {requiredLogin: true },
                  resolve: load(['js/controllers/chart.js']),
                   controller: 'DashCtrl'
              })

             .state('access', {
                url: '/auth',
                template: '<div ui-view class="fade-in-right-big smooth"></div>'
             })

             .state('access.signin', {
                url: '/signin/',
                templateUrl: 'models/auth/signin.html',
                controller: 'LoginCtrl'             
              })

              .state('access.go-to-confirm', {
                url: '/email-confirmation',
                templateUrl: 'models/auth/go-to-confirm.html',
                  controller: 'RegistrationCtrl'
              })
  
              .state('access.forgot-password', {
                url: '/forgot-password',
                templateUrl: 'models/auth/forgotpwd.html',
                controller: 'ForgotCtrl'
              })
  
              .state('access.confirm-password-reset', {
                url: '/password-reset/confirm/{userId}/{token}/',
                templateUrl: 'models/auth/password-reset.html',
                  controller: 'ResetCtrl'
              })
  
              .state('access.email-verification', {
                url: '/verify-email/{key}',
                templateUrl: 'models/auth/email-confirmed.html',
                  controller: 'EmailVerificationCtrl'
              })

              .state('app.profile', {
                url: '/profile',
                templateUrl: 'models/user/profile.html',
                data : {requiredLogin: true }
                
              })

              .state('access.unapproved', {
                url: '/unapproved',
                templateUrl: 'models/auth/unapproved.html',
                data : {requiredLogin: false }
              })

              .state('app.users', {
                url:'/users',
                templateUrl: 'models/users/users.html',
                controller: 'UsersCtrl',
                data: {requiredLogin: true}
              })

              .state('app.user-detail', {
                url:'/user/:id',
                templateUrl: 'models/users/user-detail.html',
                params: {user: 'user'},
                controller: 'UserDetailCtrl',
                data: {requiredLogin: true}
              })
               
              .state('app.deposit', {
                url: '/{id}/deposit',
                templateUrl: 'models/users/add-deposit.html',
                data : {requiredLogin: true }
              })

              .state('app.portfolio', {
                url: '/portfolio',
                templateUrl: 'models/portfolio/portfolio.html',
                data : {requiredLogin: true },
                controller :'PortfolioCtrl',
                resolve: load(['ui.select','js/controllers/select.js'])
              })


              .state('layout.app', {
                  url: '/admin',
                  views: {
                      '': {
                          templateUrl: 'tpl/layout_app.html'
                      },
                      'footer': {
                          templateUrl: 'tpl/layout_footer_fullwidth.html'
                      }
                  },
                  resolve: load( ['js/controllers/tab.js'] )
              });

          function load(srcs, callback) {
            return {
                deps: ['$ocLazyLoad', '$q',
                  function( $ocLazyLoad, $q ){
                    var deferred = $q.defer();
                    var promise  = false;
                    srcs = angular.isArray(srcs) ? srcs : srcs.split(/\s+/);
                    if(!promise){
                      promise = deferred.promise;
                    }
                    angular.forEach(srcs, function(src) {
                      promise = promise.then( function(){
                        if(JQ_CONFIG[src]){
                          return $ocLazyLoad.load(JQ_CONFIG[src]);
                        }
                        angular.forEach(MODULE_CONFIG, function(module) {
                          if( module.name == src){
                            name = module.name;
                          }else{
                            name = src;
                          }
                        });
                        return $ocLazyLoad.load(name);
                      } );
                    });
                    deferred.resolve();
                    return callback ? promise.then(function(){ return callback(); }) : promise;
                }]
            }
          }


      }
    ]
  );
