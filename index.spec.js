const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const { expect } = chai

const getWrapper = require('./index')

chai.use(sinonChai)

describe('Feature Flags wrapper', () => {
  const flagManager = {}
  const fakeLog = {
    setFilename: () => {},
    setMethodProcess: () => {},
    info: () => {},
    error: () => {},
  }
  const config = {
    flagsEnvironmentKey: 'test',
  }

  beforeEach(() => {
    flagManager.isFeatureEnabled = sinon.stub().returns(true)
  })

  it('Should add "BE_" prefix to the feature flag name', () => {
    const wrapper = getWrapper(fakeLog, config, flagManager)

    const featureFlag = wrapper.hasFeature('test')

    expect(flagManager.isFeatureEnabled).to.be.called
    expect(flagManager.isFeatureEnabled).to.be.calledWith('BE_test')
    expect(featureFlag).to.be.true
  })

  it('Should send the proper userId when using account object', () => {
    const wrapper = getWrapper(fakeLog, config, flagManager)

    const featureFlag = wrapper.hasFeature('test', { _id: 'testId', organization: 'orgId' })

    expect(flagManager.isFeatureEnabled).to.be.called
    expect(flagManager.isFeatureEnabled).to.be.calledWith('BE_test', 'testId')
    expect(featureFlag).to.be.true
  })

  it('Should send correct user properties when present', () => {
    const wrapper = getWrapper(fakeLog, config, flagManager)

    const featureFlag = wrapper.hasFeature('test', {
      _id: 'testId',
      organization: 'orgId',
      site: { _id: 'siteId' },
      country: 3,
      isCoach: true,
      isSiteAdmin: false,
      randomStuff: 'yes',
    })

    expect(flagManager.isFeatureEnabled).to.be.called
    expect(flagManager.isFeatureEnabled).to.be.calledWith('BE_test', 'testId', {
      organization: 'orgId',
      site: 'siteId',
      country: 3,
      isCoach: true,
      isSiteAdmin: false,
    })
    expect(featureFlag).to.be.true
  })

  it('Should send correct user properties when not present', () => {
    const wrapper = getWrapper(fakeLog, config, flagManager)

    const featureFlag = wrapper.hasFeature('test', { _id: 'testId' })

    expect(flagManager.isFeatureEnabled).to.be.called
    expect(flagManager.isFeatureEnabled).to.be.calledWithExactly('BE_test', 'testId', {})
    expect(featureFlag).to.be.true
  })

  it('Should use default flags when the key is none', () => {
    const wrapper = getWrapper(fakeLog, { flagsEnvironmentKey: 'none' }, flagManager)

    wrapper.hasFeature('test', { _id: 'testId' })

    expect(flagManager.isFeatureEnabled).not.to.be.called
  })

  it('Should add the configured prefix to the feature flag name', () => {
    const prefixConfig = {
      ... config,
      prefix: 'Z-'
    }
    const wrapper = getWrapper(fakeLog, prefixConfig, flagManager)

    const featureFlag = wrapper.hasFeature('test')

    expect(flagManager.isFeatureEnabled).to.be.called
    expect(flagManager.isFeatureEnabled).to.be.calledWith('Z-test')
    expect(featureFlag).to.be.true
  })

  it('Should use configured default flags when the key is none', () => {
    const defaultFlagConfig = {
      flagsEnvironmentKey: 'none',
      defaultFlags: {
        test: true,
      }
    }
    const wrapper = getWrapper(fakeLog, defaultFlagConfig, flagManager)

    const featureFlag = wrapper.hasFeature('test', { _id: 'testId' })

    expect(featureFlag).to.be.true
  })
})
