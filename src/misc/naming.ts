import { DAOClient, noReject } from '@zqbflynn/catalyst-node-commons'
import { CatalystByIdResult } from '@zqbflynn/catalyst-contracts'
import { lighthouseStorage } from '../config/simpleStorage'

export const defaultNames = [
  'zeus',
  'poseidon',
  'athena',
  'hera',
  'hephaestus',
  'aphrodite',
  'hades',
  'hermes',
  'artemis',
  'thor',
  'loki',
  'odin',
  'freyja',
  'fenrir',
  'heimdallr',
  'baldr'
]

export async function pickName(configuredNames: string | undefined, daoClient: DAOClient) {
  const existingNames: string[] = await getLighthousesNames(daoClient)

  if (typeof configuredNames === 'undefined') {
    // We use the stored name only if no name has been configured
    const previousName = await lighthouseStorage.getString('name')
    if (previousName && !existingNames.includes(previousName)) {
      return previousName
    } else if (previousName) {
      console.warn('Could not reuse previous name because another lighthouse in DAO already has it: ' + previousName)
    }
  }

  const namesList = (configuredNames?.split(',')?.map((it) => it.trim()) ?? defaultNames).filter(
    (it) => !existingNames.includes(it)
  )

  if (namesList.length === 0) throw new Error('Could not set my name! Names taken: ' + existingNames)

  const pickedName = namesList[Math.floor(Math.random() * namesList.length)]

  await lighthouseStorage.setString('name', pickedName)

  return pickedName
}

async function getLighthousesNames(daoClient: DAOClient) {
  console.log('===> Start getLighthousesNamesV2')
  const servers = await daoClient.getAllServers()
  console.log('===> getAllServers', servers)
  const namePromises = await Promise.all(Array.from(servers).map(getName).map(noReject))
  console.log('===> namePromises,', namePromises)
  const existingNames: string[] = namePromises.filter((result) => result[0] === 'fulfilled').map((result) => result[1])
  return existingNames
}

/*
 * modify by Flynn Jun
 * */
async function getName(server: CatalystByIdResult): Promise<string> {
  //Timeout is an option that is supported server side, but not browser side, so it doesn't compile if we don't cast it to any
  try {
    const statusResponse = await fetch(`${server.domain}/comms/status`, { timeout: 5000 } as any)
    const json = await statusResponse.json()

    if (json.name) {
      return json.name
    }

    throw new Error(`Response did not have the expected format. Response was: ${JSON.stringify(json)}`)
  } catch (e) {
    console.warn(`Error while getting the name of ${server.domain}, id: ${server.id}`, e.message)
    throw e
  }
}
