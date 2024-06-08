const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function runSync({ command }) {
    return new Promise((resolve, reject) => {
        exec(command, {}, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                console.log(stdout);
                resolve()
            }
        });
    });
}

function deleteFileSync({ paths }) {
    const promises = paths.map((path) => {
        return new Promise((resolve, reject) => {
            fs.unlink(path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        })
    });

    return Promise.all(promises);
}

function editFileSync() {
    const filePath = path.join('src', 'generated', 'swagger', 'api.ts');
    let content = fs.readFileSync(filePath, 'utf8');

    // Clean Enums and Remove all "= <any>"
    content = content.replace(/= <any>/g, '=');

    // Fix SupportedEntity enum
    // Replace all matches of "SupportedEntity[A-Za-z]" to "SupportedEntity.[A-Za-z]"
    // Remove all matches "enum SupportedEntity."
    content = content.replace(/SupportedEntity([A-Za-z])/g, 'SupportedEntity.$1');
    content = content.replace(/enum SupportedEntity\./g, 'enum DeprecatedSupportedEntity');

    // Fix FilterType enum
    // Replace all matches of "FilterType[A-Za-z]" to "FilterType.[A-Za-z]"
    // Remove all matches "enum FilterType."
    content = content.replace(/FilterType([A-Za-z])/g, 'FilterType.$1');
    content = content.replace(/enum FilterType\./g, 'enum DeprecatedFilterType');

    // Fix _delete to delete
    content = content.replace(/_delete/g, 'delete');

    // Write the modified content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
}

(async () => {
    try {
        await runSync({
            command: 'java -jar scripts/swagger-codegen-cli-3.0.30.jar generate -l typescript-fetch -i src/generated/swagger.json -o src/generated/swagger --additional-properties=withInterfaces=true,typescriptThreePlus=true -t ./resources/openapi/templates/typescript-axios --template-engine=mustache --template-version=6.0.1 --type-mappings ModelObject=any'
        });
        editFileSync();
        await deleteFileSync({
            paths: [
                path.join('src', 'generated', 'swagger', 'api_test.spec.ts'),
                path.join('src', 'generated', 'swagger', '.swagger-codegen-ignore'),
                path.join('src', 'generated', 'swagger', 'git_push.sh')
            ]
        })
        console.log(`[generate-api] API generated successfully!`);
    } catch (err) {
        console.error(err);
    }
})();