const { build, Platform } = require('electron-builder');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..');
const finalOutput = path.join(projectDir, 'dist');

const run = async () => {
  const stagingOutput = await fs.mkdtemp(path.join(os.tmpdir(), 'pf-video-room-build-'));

  try {
    await build({
      projectDir,
      targets: Platform.current().createTarget(),
      config: { directories: { output: stagingOutput } }
    });

    await fs.rm(finalOutput, { recursive: true, force: true });
    await fs.mkdir(finalOutput, { recursive: true });

    const artifacts = (await fs.readdir(stagingOutput, { withFileTypes: true }))
      .filter(entry => entry.isFile() && !entry.name.startsWith('builder-'));

    if (artifacts.length === 0) {
      throw new Error(`No installer artifact was produced in ${stagingOutput}`);
    }

    for (const artifact of artifacts) {
      await fs.copyFile(path.join(stagingOutput, artifact.name), path.join(finalOutput, artifact.name));
    }

    console.log(`PF Video Room installer written to ${finalOutput}`);
  } finally {
    await fs.rm(stagingOutput, { recursive: true, force: true });
  }
};

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
