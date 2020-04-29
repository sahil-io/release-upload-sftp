const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const promisify = require('util').promisify;

const writeFileAsync = promisify(fs.writeFile);


async function init() {
	const userArguments = getUserArguments();
	try {
		console.log("Configuring private_key .... ⏳");
		await configureHost(userArguments);
		await uploadFiles(userArguments)
		console.log("✅ Deploy Complete");
	} catch (error) {
		console.error("⚠️ Error deploying");
		core.setFailed(error.message);
	}
}


init()

function getUserArguments() {
	return {
		username: core.getInput("username", {required: true}),
		server: core.getInput("server", {required: true}),
		port: core.getInput("port", {required: true}),
		ssh_private_key: core.getInput("ssh_private_key", {required: true}),
		local_path: core.getInput("local_path", {required: true}),
		remote_path: core.getInput("remote_path", {required: true}),
		package_name: core.getInput("package_name", {required: true})
	};
}


async function configureHost(args) {

	try {
		const sshFolder = `${process.env['HOME']}/.ssh`;
		await exec.exec(`mkdir -v -p ${sshFolder}`);
		await writeFileAsync(`${sshFolder}/id_rsa`, args.ssh_private_key);
		await exec.exec(`chmod 600 ${sshFolder}/id_rsa`);
		await exec.exec(`chmod 700 ${sshFolder}`);
		await writeFileAsync(`${sshFolder}/known_hosts`, '');
		await exec.exec(`chmod 755 ${sshFolder}/known_hosts`);
		await writeFileAsync(`${process.env['HOME']}/sftp_command`, `put ${args.package_name}.zip ${args.remote_path}`);
		console.log("✅ Configured private_key");
	} catch (error) {
		console.error("⚠️ Error configuring private_key");
		throw error;
	}
}


async function uploadFiles(args) {
	try {
		await core.group("Deploying files", async () => {
			console.log("Archiving Files ... ⏳");
			await exec.exec(`git archive -v -o ${args.package_name}.zip HEAD`);
			await exec.exec(`unzip ${args.package_name}.zip -d ${args.package_name}`);
			await exec.exec(`rm -rf ${args.package_name}.zip`);
			await exec.exec(`zip -r ${args.package_name}.zip ${args.package_name}`);


			console.log("✅ Files ready")

			console.log("Uploading package to the server ... ⏳");
			await exec.exec(`sftp -b ${process.env['HOME']}/sftp_command -P ${args.port} -o StrictHostKeyChecking=no ${args.username}@${args.server}`);
			console.log("✅ Package successfully uploaded")

			return true;
		});
	} catch (error) {
		console.error("⚠️ Failed to deploy files");
		core.setFailed(error.message);
		throw error;
	}
}
