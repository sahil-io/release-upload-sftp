const core = require('@actions/core');
const exec = require('@actions/exec');
const fs = require('fs');
const promisify = require('util').promisify;

const writeFileAsync = promisify(fs.writeFile);


async function run() {
	const userArguments = getUserArguments();

	try {
		await configureHost(userArguments);
		await syncFiles(userArguments)
		console.log("✅ Deploy Complete");
	} catch (error) {
		console.error("⚠️ Error deploying");
		core.setFailed(error.message);
	}
}


run()

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
		await exec.exec(`chmod 700 ${sshFolder}`);
		await writeFileAsync(`${sshFolder}/known_hosts`, '');
		await exec.exec(`chmod 755 ${sshFolder}/known_hosts`);
		await writeFileAsync(`${process.env['HOME']}/sftp_command`, `put ${args.package_name}.zip ${args.remote_path}`);
		console.log("✅ Configured known_hosts");
	} catch (error) {
		console.error("⚠️ Error configuring known_hosts");
		throw error;
	}
}


/**
 * Sync changed files
 */
async function syncFiles(args) {
	try {
		await core.group("Compressing files", async () => {
			let result = await exec.exec(`git archive -o ${args.package_name}.zip HEAD`);
			console.log(result)
			result = await exec.exec(`ls -l`);
			console.log(result)
			result = await exec.exec(`sftp -b ${process.env['HOME']}/sftp_command -P ${args.port} -o StrictHostKeyChecking=no ${args.username}@${args.server}`);
			console.log(result)
			return result;
		});
	} catch (error) {
		console.error("⚠️ Failed to compress files");
		core.setFailed(error.message);
		throw error;
	}
}
