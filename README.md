# Release Uplade Action

This action uploads a repo as a zip/archive to SFTP server

## Inputs

```yml
package_name:
    description: 'name of the zip file'
    required: true
username:
    description: 'username'
    required: true
server:
    description: 'your sftp server'
    required: true
port:
    description: 'your sftp server port'
    required: true
ssh_private_key:
    description: 'you can copy private_key from your *.pem file, keep format'
    required: true
local_path:
    description: 'will put all file under this path. e.g ./*'
    required: true
remote_path:
    description: 'release file
    required: true
```

## Example usage

```yml
name: Deployment Workflow

on:
  release:
  push:
    types: [published]
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: deploy files to server
        uses: sahilNR/release-upload-sftp@v4
        with:
          package_name: 'demo-package'
          username: 'ubuntu'
          server: '${{ secrets.SERVER_IP }}'
          ssh_private_key: ${{ secrets.SSH_PRIVATE_KEY }}
          local_path: './*'
          remote_path: ${{ secrets.REMOTE_PATH}}
```

> __NOTE:__ Add `.gitattributes` to your repo with `export-ignore` attribute to exclude files from the zip. [[Example]](./resource/sample.gitattributes) 
