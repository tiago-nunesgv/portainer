import _ from 'lodash-es';
import { RegistryGitlabProject } from '../models/gitlabRegistry';
import { RegistryRepositoryGitlabViewModel } from '../models/registryRepository';
import { RepositoryTagViewModel } from '../models/repositoryTag';

angular.module('portainer.extensions.registrymanagement')
.factory('RegistryGitlabService', ['$async', 'Gitlab',
function RegistryGitlabServiceFactory($async, Gitlab) {
  'use strict';
  var service = {};

  /**
   * PROJECTS
   */

  async function _getProjectsPage(env, params, projects) {
    try {
      const response = await Gitlab(env).projects(params).$promise;
      projects = _.concat(projects, response.data);
      if (response.next) {
        params.page = response.next;
        projects = await _getProjectsPage(env, params, projects);
      }
      return projects;
    } catch (err) {
      Promise.reject(err);
    }
  }

  async function projectsAsync(url, token) {
    try {
      const data = await _getProjectsPage({url: url, token: token}, {page: 1}, []);
      return _.map(data, (project) => new RegistryGitlabProject(project));
    } catch (error) {
      Promise.reject({msg: 'Unable to retrieve projects', err: error});
    }
  }

  /**
   * END PROJECTS
   */

  /**
   * REPOSITORIES
   */

  async function _getRepositoriesPage(params, repositories) {
    try {
      const response = await Gitlab().repositories(params).$promise;
      repositories = _.concat(repositories, response.data);
      if (response.next) {
        params.page = response.next;
        repositories = await _getRepositoriesPage(params, repositories);
      }
      return repositories;
    } catch (err) {
      Promise.reject(err);
    }
  }

  async function repositoriesAsync(registry) {
    try {
      // const env = {
      //   url: registry.URL,
      //   token: registry.Password
      // };
      const params = {
        id: registry.Id,
        projectId: registry.Username,
        page: 1
      };
      const data = await _getRepositoriesPage(params, []);
      return _.map(data, (r) => new RegistryRepositoryGitlabViewModel(r));
    } catch (error) {
      Promise.reject({msg: 'Unable to retrieve repositories', err: error});
    }
  }

  /**
   * END REPOSITORIES
   */

  async function tagsAsync(registry, repository) {
    try {
      // const env = {
      //   url: registry.URL,
      //   token : registry.Password
      // };
      const params = {
        id: registry.Id,
        projectId: registry.Username,
        repositoryId: repository
      }

      const res = await Gitlab().tags(params).$promise;
      return _.map(res.data, 'name');
    } catch (error) {
      Promise.reject({msg: 'Unable to retrieve tags', err: error});
    }
  }

  async function tagAsync(registry, repository, tag) {
    try {
      // const env = {
      //   url: registry.URL,
      //   token : registry.Password
      // }
      const params = {
        id: registry.Id,
        projectId: registry.Username,
        repositoryId: repository,
        tagName: tag
      };
      const res = await Gitlab().tag(params).$promise;
      const data = res.data;
      return new RepositoryTagViewModel(data.name, data.revision, null, null, data.total_size, data.digest, null, null, null, null);
    } catch (error) {
      Promise.reject({msg: 'Unable to retrieve ' + tag, err: error});
    }
  }

  /**
   * SERVICE FUNCTIONS DECLARATION
   */

  function projects(url, token) {
    return $async(projectsAsync, url, token);
  }

  function ping(registry, forceNewConfig) {
    const env = {url: registry.URL, token: registry.Password};
    const id = registry.Id;
    if (forceNewConfig) {
      return Gitlab(env).pingWithForceNew().$promise;
    }
    return Gitlab(env).ping({id:id}).$promise;
  }

  function repositories(registry) {
    return $async(repositoriesAsync, registry);
  }

  function tags(registry, repository) {
    return $async(tagsAsync, registry, repository);
  }

  function tag(registry, repository, tag) {
    return $async(tagAsync, registry, repository, tag);
  }

  function addTag() {

  }

  function deleteTag() {

  }

  service.projects = projects;
  service.ping = ping;
  service.repositories = repositories;
  service.tags = tags;
  service.tag = tag;
  service.addTag = addTag;
  service.deleteTag = deleteTag;
  return service;
}
]);