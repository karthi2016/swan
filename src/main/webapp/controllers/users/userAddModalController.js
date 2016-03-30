'use strict';

angular.module('app').controller('userAddModalController', function ($scope, $rootScope, $http, $uibModalInstance) {

    // Initialise User View
    $scope.init = function () {
        $scope.availableRoles = [{name: "Annotator", value: "annotator"}];
        if ($scope.role === "admin") {
            $scope.availableRoles.push({value: "admin", name: "Admin"});
            $scope.availableRoles.push({name: "Project manager", value: "projectmanager"});
        }

    };


    // Called on submit
    $scope.createUser = function (prename, lastname, password, email, role) {

        // TODO: use ui-validate before allowing to add user?
        $http.get("discanno/user").then(function (response) {

            // update the list of users
            var res = JSOG.parse(JSON.stringify(response.data));
            $scope.users = res.users;

            for (var i = 0; i < $scope.users.length; i++) {
                if ($scope.users[i].email === email) {
                    $rootScope.addAlert({type: 'danger', msg: 'A user with this email address exists already.'});
                    // user exists, do not send adding request
                    return;
                }
            }


            // create new user
            var jsonTemplate = {
                "id": null,
                "prename": prename,
                "lastname": lastname,
                "password": password,
                "createdate": null,
                "email": email,
                "role": role
            };

            var user = {
                'prename': prename,
                'lastname': lastname,
                'role': role,
                'email': email,
                'loggedtime': 0,
                'undone': 0
            };

            $http.post('discanno/user', JSON.stringify(jsonTemplate))
                    .then(function (response) {
                        user.id = response.data;
                        $uibModalInstance.close(user);
                    }, function () {
                        $rootScope.addAlert({type: 'danger', msg: 'A user with this email address exists already.'});
                    });

        });



    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };

    // Initialise View
    $scope.init();



});