app.controller('UsersCtrl',
    ['$scope', '$stateParams', '$state', '$rootScope', 'UserService', 'Request', '$localStorage', 'DTOptionsBuilder', 'Utill',
        function ($scope, $stateParams, $state, $rootScope, UserService, Request, $localStorage, DTOptionsBuilder, Utill) {

            $scope.postData = {};
            $scope.errors = [];
            $scope.showLoader = false;

            $scope.datatableOptions = DTOptionsBuilder.newOptions().withBootstrap();

            $scope.getUsers = () => {
                Utill.startLoader();   
                Request.get('admin-users/').then((res) => {
                    $scope.users = res.data;
                    Utill.endLoader();
                }, (err) => {
                    Utill.endLoader();
                    Utill.showError('Sorry, something went wrong!');
                })
            }
            $scope.getUsers();

            $scope.gotoDetail = (id) => {
                $state.go('app.user-detail', { id: id })
            }

            $scope.setInvestmentStartDate = (user_id) => {
                $scope.updateUser(user_id);
            }

            $scope.updateUser = function (user_id) {
                $scope.showLoader = true;
                Utill.startLoader();   
                Request.put('users/' + user_id + '/', $scope.postData).then(function (res) {
                    $scope.user = res.data;
                    UserService.saveCurrentUser(res.data);
                    $scope.showLoader = false;
                    Utill.endLoader();

                    $state.go('app.profile', { reload: true });
                }, function (res) {
                    $scope.errors = res.data;
                    Utill.endLoader();
                })
            }

                                //==============delete==================

            $scope.deleteUser = (user) => {
                Utill.showConfirm('Are you sure?', () => {
                    Utill.startLoader();
                    Request.delete('admin-users/' + user.id + '/').then((res) => {
                        $state.go('app.users')
                        $scope.getUsers();
                        
                        Utill.endLoader();
                        Utill.showSuccess('User  Deleted!');
                    }, (res) => {
                        Utill.endLoader();
                        Utill.showError('Something Went Wrong');
                    });
                });
            }
        }]);

app.controller('UserDetailCtrl',
    ['$scope', '$stateParams', '$state', '$rootScope', 'UserService', 'Request', '$localStorage', 'DTOptionsBuilder', 'Utill',
        function ($scope, $stateParams, $state, $rootScope, UserService, Request, $localStorage, DTOptionsBuilder, Utill) {
            $scope.postData = {};
            $scope.errors = [];
            $scope.showLoader = true;
            $scope.selectedUser = {};
            $scope.showDepositForm = false;
            $scope.deposits = [];

            $scope.datatableOptions = DTOptionsBuilder.newOptions().withBootstrap();

            $scope.toggleDepositForm = (val) => {
                $scope.showDepositForm = val;
            }

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

            $scope.setInvestmentStartDate = () => {
                Utill.startLoader();
                Request.put('admin-users/' + +$stateParams.id + '/', $scope.postData).then(function (res) {
                    $scope.getUser();
                    $scope.showDatePicker = false;
                    Utill.endLoader();
                }, function (res) {
                    Utill.showError('Update Asset Failed');
                    $scope.errors = res.data;
                    Utill.endLoader();
                });
            }


            $scope.approveUser = () => {
                $scope.showLoader = true;
                Utill.startLoader();   
                Request.put('admin-users/' + $scope.selectedUser.id + '/').then(function (res) {
                    $scope.showLoader = false;
                    $scope.selectedUser = res.data;
                    Utill.endLoader();
                    Utill.showSuccess('User Approved')
                }, function (res) {
                    $scope.errors = res.data;
                    Utill.endLoader();
                    Utill.showError('Approve User Failed!')
                })
            }

            $scope.addDeposit = () => {
                $scope.postData.owner = $scope.selectedUser.id;
                Utill.startLoader();   
                Request.post('deposits/', $scope.postData).then((res) => {
                    $scope.deposits.unshift(res.data);
                    $scope.postData = {};
                    $scope.toggleDepositForm(false);
                    Utill.endLoader();
                    Utill.showSuccess('Deposit Added!');
                }, (res) => {
                    $scope.err = res.data;
                    Utill.endLoader();
                    Utill.showError('Add Deposit Failed!')
                })
            }

            $scope.getUserDeposits = () => {
                Utill.startLoader();   
                Request.get('deposits/').then((res) => {
                    $scope.deposits = res.data.filter((deposit) => {
                        return deposit.owner === +$stateParams.id;
                    });
                    $scope.depositsTotal = $scope.deposits.reduce((accumulator, deposit) => {
                        return +accumulator + +deposit.amount;
                    }, 0);
                    Utill.endLoader();
                }, (res) => {
                    $scope.err = res.data;
                    Utill.endLoader();
                })
            }

            $scope.getUserLogins = () => {
                Utill.startLoader();
                Request.get('all-logins/').then((res) => {
                    $scope.logins = res.data.filter((login) => {
                        return login.user === +$stateParams.id;
                    });
                    Utill.endLoader();
                }, (res) => {
                    $scope.err = res.data;
                    Utill.endLoader();
                })
            }

            $scope.updateUser = function () {
                $scope.showLoader = true;
                Utill.startLoader();                
                Request.put('users/' + $rootScope.user.id + '/', $scope.postData).then(function (res) {
                    $scope.user = res.data;
                    UserService.saveCurrentUser(res.data);
                    $scope.showLoader = false;
                    Utill.showSuccess('Asset Updated!');
                    Utill.endLoader();
                    $state.go('app.profile', { reload: true });
                }, function (res) {
                    Utill.showError('Update Asset Failed');
                    $scope.errors = res.data;
                    Utill.endLoader();
                });
            }

            $scope.getUser = () => {
                Utill.startLoader();
                Request.get('users/' + +$stateParams.id + '/').then((res) => {
                    $scope.selectedUser = res.data;
                    $scope.postData.investment_start_date = res.data.investment_start_date;
                    Utill.endLoader();
                }, (res) => {
                    Utill.endLoader();
                });
            }

    
            $scope.getUser();
            $scope.getUserLogins();
            $scope.getUserDeposits();
        }]);