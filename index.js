const optimizelySDK = require('@optimizely/optimizely-sdk')

const FIVE_MINUTES_IN_MILLISECONDS = 300000

const DEFAULT_CONFIG = {
  flagsEnvironmentKey: 'none',
  prefix: 'BE_',
  defaultFlags: {},
  datafile: {},
  updateInterval: FIVE_MINUTES_IN_MILLISECONDS, // 5 minutes is the default
}

const USER_PROPERTIES = [
  'organization',
  'businessUnit',
  'country',
  'site',
  'isCoach',
  'isOrganizationAdmin',
  'isBusinessUnitAdmin',
  'isSiteAdmin',
  'isAcademyAdmin',
  'canDoFinancialValidation',
]


const shouldUseDefaults = (config) => {
  const { flagsEnvironmentKey } = config
  return !flagsEnvironmentKey || flagsEnvironmentKey === 'none'
}

const defaultSerializeEntityID = (target) => {
  if (!target) return undefined

  if (target._id) return (target._id.toString) ? target._id.toString() : target._id
  if (target.id) return (target.id.toString) ? target.id.toString() : target.id
  return (target.toString) ? target.toString() : target
}

module.exports = (log, config = DEFAULT_CONFIG, flagManager = optimizely, serializeEntityID = defaultSerializeEntityID) => {
  log.setFilename('feature flags')
  const prefix = config.prefix || DEFAULT_CONFIG.prefix

  const optimizely = optimizelySDK.createInstance({
    sdkKey: config.flagsEnvironmentKey || DEFAULT_CONFIG.flagsEnvironmentKey,
    datafile: config.datafile || DEFAULT_CONFIG.datafile,
    datafileOptions: {
      updateInterval: config.updateInterval || DEFAULT_CONFIG.updateInterval,
    },
  })
  
  optimizely.onReady().then(() => {
    log.info('Feature Flags are loaded')
    log.info('Enabled Feature flags', optimizely.getEnabledFeatures('all'))
  })

  const serialize = (value) => {
    if (value === '' || value === true || value === false) return value
    if (typeof value === 'number') return value
    return serializeEntityID(value)
  }
  
  const getUserProperties = (user = {}) => (
    USER_PROPERTIES.reduce((attributes, property) => {
      if (user[property] !== undefined) attributes[property] = serialize(user[property])
      return attributes
    }, {})
  )
  /**
   *
   * @param {String} feature name of the future, will prefix with BE_
   * @param {Object} [user] user/account object
   */
  const hasFeature = (feature, user) => {
    log.setMethodProcess('hasFeature')
    const defaultFlags = config.defaultFlags || DEFAULT_CONFIG.defaultFlags

    try {
      if (shouldUseDefaults(config)) return defaultFlags[feature]
      const userId = user ? serializeEntityID(user) : 'all'
      const userProperties = getUserProperties(user)
      return flagManager.isFeatureEnabled(`${prefix}${feature}`, userId, userProperties)
    } catch (error) {
      log.error(error)
      return defaultFlags[feature]
    }
  }

  /**
   *
   * @param {String} feature name of the future, will prefix with BE_
   * @param {String} variableName name of the variable you need to get
   * @param {Object} [user] user/account object
   */
  const getFeatureVariable = (feature, variableName, user) => {
    log.setMethodProcess('getFeatureVariable')

    try {
      if (shouldUseDefaults(config)) return null
      const userId = user ? serializeEntityID(user) : 'all'
      const userProperties = getUserProperties(user)
      return flagManager.getFeatureVariable(`${PREFIX}${feature}`, variableName, userId, userProperties)
    } catch (error) {
      log.error(error)
      return null
    }
  }

  return {
    hasFeature,
    getFeatureVariable,
  }
}
