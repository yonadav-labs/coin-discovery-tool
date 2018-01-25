'use strict';

app.controller('LoginCtrl', function ($scope, Request, $window, $timeout, $state, UserService, $http, $rootScope) {
    $scope.showLoader = false;

    $scope.messages = { success: "", error: "" };
    $scope.isLoggedIn = false;

    $scope.login = () => {
        $scope.showLoader = true;
        Request.post('rest-auth/login/', $scope.postData).then((res) => {
            console.log(res.data);
            UserService.saveToken(res.data.token);
            //run a get user method to get user from api
            Request.get('users/' + res.data.user.pk + '/').then((res) => {
                UserService.saveCurrentUser(res.data);
                $rootScope.currentUser = UserService.getCurrentUser();
                $scope.isLoggedIn = true;
                // $state.go('app.dashboard',{}, {reload: true});
                $window.location.reload();

            }, (res) => {
                console.log(res.data)
                HoldOn.close();             
            });

        }, (res) => {
            $scope.errors = res.data;
            console.log(res.data)
            $scope.showLoader = false;
            HoldOn.close();
            
        });
        $timeout(() => {
            $scope.messages.success = '';
            $scope.errors = '';
        }, 6000);
    };
});

app.controller('RegistrationCtrl', function ($scope, Request, $rootScope, $timeout, $state, $http, UserService) {
    $scope.postData = {};
    $scope.showLoader = false;
    $scope.signup = () => {
        $scope.showLoader = true;
        // $scope.postData.username = $scope.postData.email;
        console.log($scope.postData)
        Request.post('rest-auth/registration/', $scope.postData).then((res) => {
            console.log(res.data);
            console.log(res);
            $state.go('access.go-to-confirm');
            HoldOn.close();

        }, (res) => {
            console.log(res);
            $scope.errors = res.data;
            HoldOn.close();
            
            console.log($scope.errors);
        });
        $scope.showLoader = false;
    };
});

app.controller('ForgotCtrl', function ($scope, Request, $timeout, $state) {
    $scope.messages = { success: '', error: '' };
    $scope.postData = {};
    $scope.showLoader = false;
    $scope.forgotPassword = () => {
        console.log('forgot')
        $scope.showLoader = true;
        Request.post('rest-auth/password/reset/', $scope.postData).then((res) => {
            console.log(res.data);
            $scope.postData = "";
            $state.go('access.forgot-password');
            HoldOn.close();
        }, (res) => {
            HoldOn.close();
            $scope.errors = res.data;
        });
        
        $timeout(() => {
            $scope.messages.success = '';
            $scope.messages.error = '';
        }, 6000);
        $scope.showLoader = false;
    }
});

app.controller('ResetCtrl', function ($scope, Request, $timeout, $state, $stateParams, $rootScope) {
    $scope.messages = { success: '', error: '' };
    $scope.postData = {};
    $scope.showLoader = false;
    $scope.postData.uid = $stateParams.userId;
    $scope.postData.token = $stateParams.token;
    $scope.resetPassword = () => {
        $scope.loading = { user: true };
        $scope.showLoader = true;
        // console.log($scope.postData)
        Request.post('rest-auth/password/reset/confirm/', $scope.postData).then((res) => {
            $scope.loading.user = false;
            $scope.success = "Password Reset Successful. Proceed to Login";
            $timeout(() => {
                $state.go('access.signin')
            }, 2000);
            HoldOn.close();
            
        }, (res) => {
            $scope.errors = res.data;
            console.log(res);
            HoldOn.close();
            
        });
        $scope.showLoader = false;
    }
});

app.controller('EmailVerificationCtrl', function ($scope, $location, Request, $timeout, $state, UserService, $http, $rootScope, $stateParams) {
    $scope.postData = {};
    $scope.postData.key = $stateParams.key;
    $scope.showLoader = false;
    console.log($stateParams.key)
    // $scope.postData.token = location.pathname.split('/')[2];
    $scope.verifyEmail = () => {
        $scope.showLoader = true;
        Request.post('rest-auth/registration/verify-email/', $scope.postData).then((res) => {
            $timeout(() => {
                $state.go('access.signin')
            }, 3000);
            HoldOn.close();
            
        }, (err) => {
            $scope.errors = err.data;
            HoldOn.close();
        });
        $timeout(() => {
            $scope.success = '';
            $scope.errors = '';
        }, 6000);
        $scope.showLoader = false;
    };
    $scope.verifyEmail();
});

app.controller('EmailVerificationResendCtrl', function ($scope, $location, Request, $timeout, $state, UserService, $http, $rootScope, $stateParams) {
    $scope.postData = {};
    $scope.showLoader = false;
    $scope.messages = { success: "", error: "" };
    $scope.loading = {};

    $scope.currentUser = UserService.getCurrentUser();
    // $scope.postData.token = location.pathname.split('/')[2];
    $scope.resendEmail = () => {
        $scope.loading = {
            user: true
        }
        $scope.showLoader = true;
        Request.get('/auth/user/' + $scope.currentUser._id + '/resend-confirmation').then((res) => {
            if (res.data.success) {
                $scope.messages.success = res.data.message;
                $scope.loading.user = false;
                // $state.go('auth.login');
            }
            HoldOn.close();
        }, (err) => {
            $scope.messages.error = err.data.message;
            HoldOn.close();
        });
        $timeout(() => {
            $scope.messages.success = '';
            $scope.messages.error = '';
        }, 6000);
        $scope.showLoader = false;
    }
});