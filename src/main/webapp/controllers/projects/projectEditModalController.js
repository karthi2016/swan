/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';

angular
    .module('app')
    .controller('projectEditModalController', function ($scope, $rootScope, $http, $uibModalInstance, $window) {

        $scope.init = function () {
            $scope.loadUsers();
            $scope.projUsers = $rootScope.tableProjects[$rootScope.currentProjectIndex].users;
            $scope.projPms = $rootScope.tableProjects[$rootScope.currentProjectIndex].pms;
            $scope.watchingUsers = $rootScope.tableProjects[$rootScope.currentProjectIndex].watchingUsers;
            $rootScope.role = $window.sessionStorage.role;
            $scope.currUser = {'id': parseInt($window.sessionStorage.uId)};
            $scope.isWatching = $rootScope.tableProjects[$rootScope.currentProjectIndex].isWatching;
        };

        $scope.loadUsers = function () {
            $http.get("discanno/user").success(function (response) {
                var usersPms = JSOG.parse(JSON.stringify(response)).users;
                $scope.users = [];
                $scope.pms = [];
                for (var i = 0; i < usersPms.length; i++) {
                    var u = usersPms[i];
                    if (u.role == 'annotator') {
                        $scope.users.push(u);
                    } else {
                        if (u.role == 'projectmanager') {
                            $scope.pms.push(u);
                        }
                    }
                }
            }).error(function (response) {
                $rootScope.checkResponseStatusCode(response.status);
            });
        };

        $scope.addSelectedUser = function () {
            $http.post("discanno/project/add/" + $rootScope.currentProjectId + "/" + $scope.newUser).success(function (response) {
                var emptyTemplate = ['0'];
                for (var i = 0; i < $scope.users.length; i++) {
                    var u = $scope.users[i];
                    if (u.id === $scope.newUser) {
                        var proj = $rootScope.tableProjects[$rootScope.currentProjectIndex];
                        proj.users.push(u);
                        if (proj.completed.length == undefined) {
                            proj.completed = emptyTemplate;
                        } else {
                            proj.completed.push(0);
                        }
                    }
                }
            }).error(function (response) {
                $rootScope.checkResponseStatusCode(response.status);
            });
        };

        $scope.addSelectedPM = function () {
            $http.post("discanno/project/addManager/" + $rootScope.currentProjectId + "/" + $scope.newPM).success(function (response) {
                var emptyTemplate = ['0'];
                for (var i = 0; i < $scope.pms.length; i++) {
                    if ($scope.pms[i].id === $scope.newPM) {
                        $rootScope.tableProjects[$rootScope.currentProjectIndex].pms.push($scope.pms[i]);
                        if ($rootScope.tableProjects[$rootScope.currentProjectIndex].completed.length == undefined) {
                            $rootScope.tableProjects[$rootScope.currentProjectIndex].completed = emptyTemplate;
                        } else {
                            $rootScope.tableProjects[$rootScope.currentProjectIndex].completed.push(0);
                        }
                    }
                }
            }).error(function (response) {
                $rootScope.checkResponseStatusCode(response.status);
            });
        };

        $scope.deleteUser = function (uId) {
            $http.post("discanno/project/del/" + $rootScope.currentProjectId + "/" + uId).success(function (response) {
                var projectT = $rootScope.tableProjects[$rootScope.currentProjectIndex];
                for (var i = 0; i < projectT.users.length; i++) {
                    if (projectT.users[i].id == uId) {
                        projectT.users.splice(i, 1);
                        projectT.completed.splice(i, 1);
                        break;
                    }
                }
                // TODO refactor
                // Not the most elegant code, we should change that when we do the
                // big refactoring, when merging $rootScope.projects and $rootScope.tableProjects
                var completedDecreaseMap = {};
                for (var i = 0; i < $rootScope.projects.length; i++) {
                    var project = $rootScope.projects[i];
                    for (var j = 0; j < project.documents.length; j++) {
                        var doc = project.documents[j];
                        for (var s = 0; s < doc.states.length; s++) {
                            var state = doc.states[s];
                            if (state.completed && state.user.id == uId) {
                                completedDecreaseMap[state.document.id] = state.document.id;
                                break;
                            }
                        }
                    }
                }

                for (var i = 0; i < projectT.documents.length; i++) {
                    var doc = projectT.documents[i];
                    if (completedDecreaseMap[doc.id] !== undefined
                            && doc.completed > 0) {
                        doc.completed--;
                    }
                }
            }).error(function (response) {
                $rootScope.checkResponseStatusCode(response.status);
            });
        };

        $scope.deletePM = function (uId) {
            $http.post("discanno/project/del/" + $rootScope.currentProjectId + "/" + uId).success(function (response) {
                var project = $rootScope.tableProjects[$rootScope.currentProjectIndex];
                for (var i = 0; i < project.pms.length; i++) {
                    if (project.pms[i].id == uId) {
                        project.pms.splice(i, 1);
                        break;
                    }
                }
            }).error(function (response) {
                $rootScope.checkResponseStatusCode(response.status);
            });
        };

        /**
         * Returns a complement of a main list and sublist of users. Used for
         * dropdown menus.
         *
         * @param {Array<User>} userList The main list.
         * @param {Array<User>} subList The sublist whose elements are not in the
         *                      comeplementList.
         * @return {Array<User>} complementList Contains all elements from userList
         *                      except all elements from subList.
         */
        $scope.getUserComplement = function (userList, subList) {
            if (userList == undefined) {
                return subList;
            }
            var complementList = [];
            for (var i = 0; i < userList.length; i++) {
                if (!$rootScope.containsUser(subList, userList[i])) {
                    complementList.push(userList[i]);
                }
            }
            return complementList;
        };

        $scope.watchProject = function (bool) {
            var proj = $rootScope.tableProjects[$rootScope.currentProjectIndex];
            if (bool) {
                // Add project manager to watching list
                $http.post("discanno/project/addWatchingUser/" + proj.id + "/" + $window.sessionStorage.uId).success(function (response) {
                    if ($scope.watchingUsers === undefined) {
                        $scope.watchingUsers = [];
                    }
                    $scope.watchingUsers.push($scope.currUser);
                    $scope.isWatching = true;
                    $rootScope.tableProjects[$rootScope.currentProjectIndex].isWatching = true;
                }).error(function (response) {
                                    $rootScope.checkResponseStatusCode(response.status);
                            });
            } else {
                // Remove project manager from watching list
                $http.post("discanno/project/delWatchingUser/" + proj.id + "/" + $window.sessionStorage.uId).success(function (response) {
                    for (var i = 0; i < $scope.watchingUsers.length; i++) {
                        if ($scope.watchingUsers[i].id === $scope.currUser.id) {
                            $scope.watchingUsers.splice(i, 1);
                            $scope.isWatching = false;
                            $rootScope.tableProjects[$rootScope.currentProjectIndex].isWatching = false;
                        }
                    }
                }).error(function (response) {
                                    $rootScope.checkResponseStatusCode(response.status);
                            });
            }
            $rootScope.tableProjects[$rootScope.currentProjectIndex].watchingUsers = $scope.watchingUsers;
        };

        $scope.submit = function (name) {
            $uibModalInstance.close(name);
        };
        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };

        $scope.init();
    });