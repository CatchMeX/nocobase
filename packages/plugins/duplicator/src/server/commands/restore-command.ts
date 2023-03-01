import { Application } from '@nocobase/server';
import { Restorer } from '../restorer';
import inquirer from 'inquirer';

export default function addRestoreCommand(app: Application) {
  app
    .command('restore')
    .argument('<string>', 'restore file path')
    .option('-a, --app <appName>', 'sub app name if you want to restore into a sub app')
    .action(async (restoreFilePath, options) => {
      if (!options.app) {
        await restoreActionCommand(app, restoreFilePath);
        return;
      }

      if (
        !(await app.db.getCollection('applications').repository.findOne({
          filter: { name: options.app },
        }))
      ) {
        // create sub app if not exists
        await app.db.getCollection('applications').repository.create({
          values: {
            name: options.app,
          },
        });
      }

      const subApp = await app.appManager.getApplication(options.app);

      if (!subApp) {
        app.log.error(`app ${options.app} not found`);
        await app.stop();
        return;
      }

      await restoreActionCommand(subApp, restoreFilePath);
    });
}

interface RestoreContext {
  app: Application;
  dir: string;
}

async function restoreWarning() {
  const results = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Danger !!! This action will overwrite your current data, please make sure you have a backup❗️❗️',
      default: false,
    },
  ]);

  return results.confirm;
}

async function restoreActionCommand(app: Application, restoreFilePath: string) {
  // should confirm data will be overwritten
  if (!(await restoreWarning())) {
    return;
  }

  const restorer = new Restorer(app, restoreFilePath);
  await restorer.restore();
  await app.stop();
}
