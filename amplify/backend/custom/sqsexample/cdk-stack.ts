import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { AmplifyDependentResourcesAttributes } from '../../types/amplify-dependent-resources-ref';
//import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class cdkStack extends cdk.Stack {
	constructor(
		scope: Construct,
		id: string,
		props?: cdk.StackProps,
		amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps
	) {
		super(scope, id, props);
		/* Do not remove - Amplify CLI automatically injects the current deployment environment in this input parameter */
		new cdk.CfnParameter(this, 'env', {
			type: 'String',
			description: 'Current Amplify CLI env name'
		});
		/* AWS CDK code goes here - learn more: https://docs.aws.amazon.com/cdk/latest/guide/home.html */

		const amplifyProjectInfo = AmplifyHelpers.getProjectInfo();
		const env = cdk.Fn.ref('env');

		const prefixName = `sqs-${amplifyProjectInfo.projectName}-${env}`;

		// Create SQS Queue
		const queue = new sqs.Queue(this, 'queue1', {
			queueName: `${prefixName}-queue1`
		});

		// Output SQS
		new cdk.CfnOutput(this, 'queueUrl', {
			value: queue.queueUrl
		});

		new cdk.CfnOutput(this, 'queueArn', {
			value: queue.queueArn
		});

		new cdk.CfnOutput(this, 'queueName', {
			value: queue.queueName
		});

		// Access other Amplify Resources

		const dependencies: AmplifyDependentResourcesAttributes = AmplifyHelpers.addResourceDependency(
			this,
			amplifyResourceProps.category,
			amplifyResourceProps.resourceName,
			[
				{
					category: 'function',
					resourceName: 'lambdaLectura'
				}
			]
		);

		const functionLecturaArn = cdk.Fn.ref(dependencies.function.lambdaLectura.Arn);
		const functionERoleArn = cdk.Fn.ref(dependencies.function.lambdaLectura.LambdaExecutionRoleArn);

		const funcionLectura = lambda.Function.fromFunctionArn(
			this,
			'functionLecturaId',
			functionLecturaArn
		);
		const functionRoleExc = iam.Role.fromRoleArn(this, 'functionRoleExcId', functionERoleArn);

		// dar permisos de lectura de mensajes al rol de ejecucion de la funcion
		//? Desplegar antes de suscribir funcion
		queue.grantConsumeMessages(functionRoleExc);
	}
}
