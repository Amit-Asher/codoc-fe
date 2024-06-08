const fse = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');

(async () => {
    // load env
    dotenv.config();
    console.log(`[fetch-spec] Coping API Spec from LOCAL path "${process.env.API_SERVER_SPEC_PATH}"...`);
    // load env
    dotenv.config();
    // Create generated dir if not yet exists
    await fse.promises.mkdir(path.join('src/generated'), { recursive: true });
    // copy spec file from local path to generated dir in src
    await fse.promises.copyFile(
        path.join(process.env.API_SERVER_SPEC_PATH),
        path.join('src', 'generated', 'swagger.json')
    );
    console.log(`[fetch-spec] API Spec fetched successfully!`);
})();