'use strict';

/* Controllers */

angular.module('app')
  .controller('AppCtrl', ['$scope', '$state', '$translate', '$localStorage', '$window', '$rootScope', 'Request', 'UserService',
    function ($scope, $state, $translate, $localStorage, $window, $rootScope, Request, UserService) {
      // add 'ie' classes to html
      var isIE = !!navigator.userAgent.match(/MSIE/i);
      if (isIE) { angular.element($window.document.body).addClass('ie'); }
      if (isSmartDevice($window)) { angular.element($window.document.body).addClass('smart') };


      // config
      $scope.app = {
        name: 'Mutual Coin Fund',
        version: '1.0.0',
        // for chart colors
        color: {
          primary: '#7266ba',
          info: '#23b7e5',
          success: '#27c24c',
          warning: '#fad733',
          danger: '#f05050',
          light: '#e8eff0',
          dark: '#3a3f51',
          black: '#1c2b36'
        },
        settings: {
          themeID: 1,
          navbarHeaderColor: 'bg-black',
          navbarCollapseColor: 'bg-white-only',
          asideColor: 'bg-black',
          headerFixed: true,
          asideFixed: false,
          asideFolded: false,
          asideDock: false,
          container: false
        }
      }


      //user info localstorage and logout method
      $rootScope.user = UserService.getCurrentUser();

      $rootScope.logout = function () {
        UserService.logoutCurrentUser();
        $state.go('access.signin', {}, { reload: true });
        Request.post('rest-auth/logout/', $scope.postData).then(function (res) {
          console.log(res.data)
         
          HoldOn.close();

        }, function (res) {
          $scope.errors = res.data;
          HoldOn.close();

        })

      }

      // save settings to local storage
      if (angular.isDefined($localStorage.settings)) {
        $scope.app.settings = $localStorage.settings;
      } else {
        $localStorage.settings = $scope.app.settings;
      }
      $scope.$watch('app.settings', function () {
        if ($scope.app.settings.asideDock && $scope.app.settings.asideFixed) {
          // aside dock and fixed must set the header fixed.
          $scope.app.settings.headerFixed = true;
        }
        // for box layout, add background image
        $scope.app.settings.container ? angular.element('html').addClass('bg') : angular.element('html').removeClass('bg');
        // save to local storage
        $localStorage.settings = $scope.app.settings;
      }, true);

      // angular translate
      $scope.lang = { isopen: false };

      $scope.langs = { en: 'English', de_DE: 'German', it_IT: 'Italian' };
      $scope.selectLang = $scope.langs[$translate.proposedLanguage()] || "English";
      $scope.setLang = function (langKey, $event) {
        // set the current lang
        $scope.selectLang = $scope.langs[langKey];
        // You can change the language during runtime
        $translate.use(langKey);
        $scope.lang.isopen = !$scope.lang.isopen;
      };

      function isSmartDevice($window) {
        // Adapted from http://www.detectmobilebrowsers.com
        var ua = $window['navigator']['userAgent'] || $window['navigator']['vendor'] || $window['opera'];
        // Checks for iOs, Android, Blackberry, Opera Mini, and Windows mobile devices
        return (/iPhone|iPod|iPad|Silk|Android|BlackBerry|Opera Mini|IEMobile/).test(ua);
      }

    }]);
