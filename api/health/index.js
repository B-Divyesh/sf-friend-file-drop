'use strict';

const { version } = require('../package.json');

module.exports = async function health(context) {
  const sourceRevision = process.env.FRIEND_FILE_DROP_SOURCE_REVISION
    || process.env.GITHUB_SHA
    || process.env.BUILD_SOURCEVERSION
    || '';
  const deploymentId = process.env.WEBSITE_DEPLOYMENT_ID || process.env.WEBSITE_INSTANCE_ID || '';
  const hasBuildIdentity = /^[0-9a-f]{40}$/i.test(sourceRevision) && deploymentId.trim().length > 0;
  context.res = {
    status: hasBuildIdentity ? 200 : 503,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: {
      service: 'friend-file-drop-api',
      version,
      sourceRevision: sourceRevision || null,
      deploymentId: deploymentId || null,
      status: hasBuildIdentity ? 'ready' : 'build-identity-missing'
    }
  };
};
