import { Struct } from 'google-protobuf/google/protobuf/struct_pb';
import * as chai from 'chai';
import { default as sinon } from 'ts-sinon';
import * as sinonChai from 'sinon-chai';
import 'mocha';

import { Step as ProtoStep, StepDefinition, FieldDefinition, RunStepResponse } from '../../src/proto/cog_pb';
import { Step } from '../../src/steps/create-lead';

chai.use(sinonChai);

describe('CreateLeadStep', () => {
  const expect = chai.expect;
  let protoStep: ProtoStep;
  let stepUnderTest: Step;
  let apiClientStub: any;
  let sobjectStub: any;

  beforeEach(() => {
    sobjectStub = {create: sinon.stub(),
    };
    apiClientStub = {sobject: sinon.stub()};
    apiClientStub.sobject.returns(sobjectStub);
    stepUnderTest = new Step(apiClientStub);
    protoStep = new ProtoStep();
  });

  it('should return expected step metadata', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    expect(stepDef.getStepId()).to.equal('CreateLead');
    expect(stepDef.getName()).to.equal('Create a Salesforce Lead');
    expect(stepDef.getExpression()).to.equal('create a Salesforce Lead');
  });

  it('should return expected step fields', () => {
    const stepDef: StepDefinition = stepUnderTest.getDefinition();
    const fields: any[] = stepDef.getExpectedFieldsList().map((field: FieldDefinition) => {
      return field.toObject();
    });

    // Lead field
    const lead: any = fields.filter(f => f.key === 'lead')[0];
    expect(lead.optionality).to.equal(FieldDefinition.Optionality.REQUIRED);
    expect(lead.type).to.equal(FieldDefinition.Type.MAP);
  });

  it('should respond with pass if lead is created.', async () => {
    // Stub a response that matches expectations.
    const expectedResponse: any = {id: 'abcxyz'};
    sobjectStub.create.callsArgWith(1, null, expectedResponse);

    // Set step data corresponding to expectations
    const expectedLead: any = {lead: {Email: 'anything@example.com'}};
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(apiClientStub.sobject).to.have.been.calledWith('Lead');
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.PASSED);
    expect(sobjectStub.create).to.have.been.calledWith(expectedLead.lead);
  });

  it('should respond with fail if create method returns an error.', async () => {
    // Stub a response that matches expectations.
    const expectedError: Error = new Error('Any Error');
    sobjectStub.create.callsArgWith(1, expectedError);

    // Set step data corresponding to expectations
    const expectedLead: any = {lead: {Email: 'anything@example.com'}};
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.FAILED);
  });

  it('should respond with error if create method throws an error', async () => {
    // Stub a response that matches expectations.
    sobjectStub.create.throws();

    // Set step data corresponding to expectations
    const expectedLead: any = {lead: {Email: 'anything@example.com'}};
    protoStep.setData(Struct.fromJavaScript(expectedLead));

    const response: RunStepResponse = await stepUnderTest.executeStep(protoStep);
    expect(response.getOutcome()).to.equal(RunStepResponse.Outcome.ERROR);
  });

});
