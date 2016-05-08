/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
'use strict';

angular
    .module('app')
    .controller('projectsController', ['$scope', '$rootScope', '$window', '$http', '$uibModal', '$location', 'hotkeys', '$q',
        function ($scope, $rootScope, $window, $http, $uibModal, $location, hotkeys, $q) {

            // Redirect if client is not logged in
            if (($window.sessionStorage.role != 'admin')
                    && ($window.sessionStorage.role != 'annotator')
                    && ($window.sessionStorage.role != 'projectmanager')) {
                $rootScope.redirectToLogin();
            } else {

                $scope.isUnprivileged = $window.sessionStorage.isAnnotator;

                /**
                 * Called at the end of Controller construction.
                 * Initializes fields with data from Server.
                 */
                $scope.init = function () {
                    $scope.loaded = false;
                    // Used to determine which projects are currently toggled
                    $rootScope.collapsed = {};
                    var httpProjects = $rootScope.loadProjects();
                    var httpSchemes = $scope.loadSchemes();
                    // Wait for both http requests to be answered
                    $q.all([httpProjects, httpSchemes]).then(function () {
                        $scope.loaded = true;
                        $rootScope.buildTableProjects();
                    });

                    if ($rootScope.tour !== undefined) {
                        $rootScope.tour.resume();
                    }
                };

                /**
                 * Enables '+'-Hotkey
                 */
                hotkeys.bindTo($scope).add({
                    combo: '+',
                    description: 'Adding a new Project',
                    callback: function () {
                        $scope.openProjectModal();
                    }
                });

                /**
                 * Used for the toggle + Button.
                 * @param {type} id the id of the Project to toggle.
                 * @returns {String} css class.
                 */
                $scope.computeCssClass = function (id) {

                    // To also make new Document collapsed on default
                    if ($rootScope.collapsed[id] == true) {
                        return "in";
                    }
                };

                /**
                 * Returns if a given project is toggled.
                 * @param {type} id the id of the Project.
                 */
                $scope.projectToggeled = function (id) {
                    if ($scope.toggeled === undefined) {
                        $scope.toggeled = {};
                    }
                    var tog = $scope.toggeled[id];
                    if (tog === undefined) {
                        $scope.toggeled[id] = true;
                    } else if (tog) {
                        $scope.toggeled[id] = false;
                    } else {
                        $scope.toggeled[id] = true;
                    }
                };

                /**
                 * Used to determine if the export button should be enabled.
                 * @param {type} id The Id of the Project.
                 * @returns {String} if export is possible
                 */
                $scope.isExportPossible = function (id) {
                    var index = $scope.getProjectIndexById(id);
                    if ($rootScope.tableProjects[index].documents == undefined
                            || $rootScope.tableProjects[index].documents.length == 0
                            || $rootScope.tableProjects[index].users == undefined
                            || $rootScope.tableProjects[index].users.length == 0) {
                        return 'false';
                    } else {
                        return 'true';
                    }
                };

                /**
                 * Returns the index of a project in the table.
                 * @param {type} id the id of the project
                 * @returns {Number} the index
                 */
                $scope.getProjectIndexById = function (id) {
                    for (var i = 0; i < $rootScope.tableProjects.length; i++) {
                        if ($rootScope.tableProjects[i].id === id) {
                            return i;
                        }
                    }
                };

                /**
                 * Load Schemes from Database
                 */
                $scope.loadSchemes = function () {
                    var httpSchemes = $http.get("discanno/scheme/schemes").success(function (response) {
                        $rootScope.schemes = JSOG.parse(JSON.stringify(response)).schemes;
                    }).error(function (response) {
                        $rootScope.checkResponseStatusCode(response.status);
                    });
                    return httpSchemes;
                };

                /**
                 * Get the address to export a project.
                 * @param {type} projId the Projects id
                 * @returns {String} the adress for export
                 */
                $scope.exportProject = function (projId) {
                    return "discanno/project/export/" + projId;
                };

                /**
                 * Get the address to export a project.
                 * @param {type} projId the Projects id
                 * @returns {String} the adress for export
                 */
                $scope.exportProjectXmi = function (projId) {
                    return "discanno/project/exportXmi/" + projId;
                };

                /**
                 * Redirects to the AnnotationTool
                 *
                 * @param {String} docId The document id to annotate
                 * @param {String} document name
                 * @param {String} projectName the Projects name
                 * @param {Boolean} completed state of the document
                 */
                $scope.openAnnoTool = function (docId, docName, projectName, completed) {
                    $scope.alertVisible = true;
                    $rootScope.initAnnoTool(docId, docName, projectName, completed);
                    $location.path('/annotation');
                };

                /******************
                 *******Modals*****
                 *******************/

                /**
                 * Called upon clicking the 'Pen'-Glyphicon.
                 * Opens the ProjectEditModal.
                 * @param {type} projectId the id of the project
                 * @param {type} projectName the name of the project
                 */
                $scope.editProject = function (projectId, projectName) {
                    $rootScope.currentProjectIndex = $scope.getProjectIndexById(projectId);
                    $rootScope.currentProjectId = projectId;
                    $rootScope.currentProjectName = projectName;
                    var modalInstance = $uibModal.open({
                        animation: $scope.animationsEnabled,
                        templateUrl: 'templates/projects/projectEditModal.html',
                        controller: 'projectEditModalController'
                    });

                    modalInstance.result.then(function (result) {

                    }, function () {

                    });

                    $scope.toggleAnimation = function () {
                        $scope.animationsEnabled = !$scope.animationsEnabled;
                    };

                };

                /**
                 * Called upon clicking the 'Page'-Button.
                 * Opens the SchemeViewModal
                 * @param {type} projectId the projects id
                 */
                $scope.openProjectSchemeModal = function (projectId) {

                    var isSearching = true;
                    for (var i = 0; i < $rootScope.schemes.length && isSearching; i++) {
                        var scheme = $rootScope.schemes[i];
                        for (var j = 0; j < scheme.projects.length; j++) {
                            var proj = scheme.projects[j];
                            if (proj.id === projectId) {
                                $rootScope.currentScheme = scheme;
                                isSearching = false;
                                break;
                            }
                        }
                    }

                    var modalInstance = $uibModal.open({
                        animation: $scope.animationsEnabled,
                        templateUrl: 'templates/schemes/schemeViewModal.html',
                        controller: 'schemeViewModalController'
                    });

                    modalInstance.result.then(function (response) {

                    });
                    $scope.toggleAnimation = function () {
                        $scope.animationsEnabled = !$scope.animationsEnabled;
                    };
                };

                /**
                 * Called upon clicking the 'x'-Button
                 * Opens the ProjectDeleteModal
                 * @param {type} projectId the projects id
                 */
                $scope.openProjectDeleteModal = function (projectId) {
                    $rootScope.currentProjectIndex = $scope.getProjectIndexById(projectId);
                    $rootScope.currentProjectId = projectId;
                    var modalInstance = $uibModal.open({
                        animation: $scope.animationsEnabled,
                        templateUrl: 'templates/projects/projectDeleteModal.html',
                        controller: 'projectDeleteModalController'
                    });

                    modalInstance.result.then(function (response) {

                    });
                    $scope.toggleAnimation = function () {
                        $scope.animationsEnabled = !$scope.animationsEnabled;
                    };
                };

                /**
                 * Called upon clicking the 'x'-Button
                 * Opens the DocumenttDeleteModal
                 * @param {type} projectId the projects id
                 */
                $scope.openDocumentDeleteModal = function (documentId, projId) {
                    $rootScope.documentId = documentId;
                    $rootScope.projId = projId;
                    var modalInstance = $uibModal.open({
                        animation: $scope.animationsEnabled,
                        templateUrl: 'templates/projects/documentDeleteModal.html',
                        controller: 'documentDeleteModalController'
                    });

                    modalInstance.result.then(function (response) {

                    });
                    $scope.toggleAnimation = function () {
                        $scope.animationsEnabled = !$scope.animationsEnabled;
                    };
                };

                /**
                 * Called upon clicking the '+ Project'-Button
                 * Opens the ProjectAddModal
                 */
                $scope.openProjectAddModal = function () {

                    var modalInstance = $uibModal.open({
                        animation: $scope.animationsEnabled,
                        templateUrl: 'templates/projects/projectAddModal.html',
                        controller: 'projectAddModalController'
                    });

                    modalInstance.result.then(function (full) {
                        var projectTemplate = {
                            'name': full.name,
                            'id': null,
                            'documents': [],
                            'scheme': {
                                'id': full.scheme.id
                            }
                        };

                        $http.post('discanno/project', JSON.stringify(projectTemplate)).then(function (response) {
                            var template = {
                                'id': response.data,
                                'name': full.name,
                                'scheme': projectTemplate.scheme,
                                'users': [],
                                'pms': [],
                                'completed': [],
                                'numberOfDocuments': 0,
                                'documents': []
                            };

                            if ($window.sessionStorage.role != 'projectmanager') {
                                $rootScope.tableProjects.push(template);
                                $rootScope.projects.push(template);
                            } else {
                                // TODO necessary?
                                //get the current user (there is not REST interface for getUser by ID)
                                $http.get("discanno/user/").then(function (response) {
                                    var users = JSOG.parse(JSON.stringify(response.data)).users;
                                    for (var i = 0; i < users.length; i++) {
                                        var u = users[i];
                                        if ($window.sessionStorage.uId == u.id) {
                                            template.pms = [u];
                                        }
                                    }
                                    $rootScope.tableProjects.push(template);
                                    $rootScope.projects.push(template);
                                }, function () {});

                                // Add project manager to the corresponding proj manager list
                                $http.post("discanno/project/addManager/"
                                        + template.id
                                        + "/"
                                        + $window.sessionStorage.uId);
                            }
                            $scope.projectToggeled(response.data);

                        }, function () {
                            $rootScope.addAlert({type: 'danger', msg: 'A Project with this name already exists.'});
                        });

                        if ($rootScope.tour !== undefined) {
                            $("#tour-next-button").prop("disabled", false);
                        }
                    }, function () {

                    });
                    $scope.toggleAnimation = function () {
                        $scope.animationsEnabled = !$scope.animationsEnabled;
                    };
                };

                /**
                 * Called upon clicking the '+ Document'-Button
                 * Opens the DocumentAddModal.
                 * @param {type} projectId the projects id
                 */
                $scope.openDocumentAddModal = function (projectId) {
                    var projectIndex = $scope.getProjectIndexById(projectId);
                    $rootScope.collapsed[projectId] = true;
                    $rootScope.currentProjectIndex = projectIndex;
                    $rootScope.currentProjectId = projectId;
                    var modalInstance = $uibModal.open({
                        animation: $scope.animationsEnabled,
                        templateUrl: 'templates/projects/documentAddModal.html',
                        controller: 'documentAddModalController'
                    });

                    modalInstance.result.then(function (result) {

                    }, function () {

                    });

                    $scope.toggleAnimation = function () {
                        $scope.animationsEnabled = !$scope.animationsEnabled;
                    };

                };

                $scope.init();
            }
        }
    ]);



