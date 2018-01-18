app.controller('UserCtrl',
    ['$scope', '$stateParams', '$state', '$rootScope', 'UserService', 'Request', '$localStorage',
        function ($scope, $stateParams, $state, $rootScope, UserService, Request, $localStorage) {

            $scope.postData = {};
            $scope.errors = [];
            $scope.showLoader = false;
            $scope.showPhoneForm = false;

            $scope.togglePhoneForm = function () {
                $scope.showPhoneForm != $scope.showPhoneForm;
            }

            $scope.updateUser = function () {
                Request.put('users/' + $rootScope.user.id + '/', $scope.postData).then(function (res) {
                    $scope.user = res.data;
                    UserService.saveCurrentUser(res.data);
                    $scope.showLoader = false;
                    $state.go('app.profile', { reload: true });
                }, function (res) {
                    $scope.errors = res.data;
                })
            }
        }]);