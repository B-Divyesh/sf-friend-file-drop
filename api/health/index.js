'use strict';

const { version } = require('../package.json');

module.exports = async function health(context) {
  context.res = {
    status: 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    body: {
      service: 'friend-file-drop-api',
      version,
      sourceRevision: process.env.BUILD_SOURCEVERSION || process.env.GITHUB_SHA || null,
      deploymentId: process.env.WEBSITE_DEPLOYMENT_ID || process.env.WEBSITE_INSTANCE_ID || null
    }
  };
};
