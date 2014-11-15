//
//  Answer.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "AN_Address.h"
#import "AN_DateTime.h"
#import "AN_EmailAddress.h"
#import "AN_Matrix.h"
#import "AN_MultiChoice.h"
#import "AN_Name.h"
#import "AN_Text.h"
#import "AN_Url.h"
#import "AN_FileUpload.h"
#import "AN_Number.h"
#import "AN_PhoneNumber.h"
#import "Question.h"

@implementation Answer

@synthesize questionId, questionType;

+ (NSMutableArray *)allocAnswersFromXML:(NSString *)xml {
	TBXML          *tbxml = [TBXML tbxmlWithXMLString:xml];
	TBXMLElement   *root = tbxml.rootXMLElement;
	NSMutableArray *answers = [[NSMutableArray alloc] init];
	
	if ( root ) {
		unsigned long  answerType = 0;
		TBXMLElement *answer = [TBXML childElementNamed:@"answer" parentElement:root];
		Answer       *obj;
		
		// Go through the pages
		while ( answer ) {
			answerType = [[TBXML valueOfAttributeNamed:@"qType" forElement:answer] integerValue];

			obj = NULL;
			switch ( answerType ) {
				case 100:
				case 200:
					obj = [AN_Text alloc];
					break;
					
				case 400: obj = [AN_MultiChoice alloc];
					break;
					
				case 800: obj = [AN_Name alloc];
					break;
					
				case 900: obj = [AN_Address alloc];
					break;
					
				case 950: obj = [AN_PhoneNumber alloc];
					break;
					
				case 1000: obj = [AN_DateTime alloc];
					break;

				case 1100: obj = [AN_Number alloc];
					break;

				case 1200: obj = [AN_Matrix alloc];
					break;
					
				case 1400: obj = [AN_EmailAddress alloc];
					break;
					
				case 1500: obj = [AN_Url alloc];
					break;

				case 1600: obj = [AN_FileUpload alloc];
					break;
			}
			
			if ( obj ) {
				obj = [obj initWithXML:answer];
				obj.questionType = answerType;
				
				[answers addObject:obj];
			}

			answer = [TBXML nextSiblingNamed:@"answer" searchFromElement: answer];
		}
	}
	
	return answers;
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super init];
	questionId = [[TBXML valueOfAttributeNamed:@"qID" forElement:node] integerValue];

	return self;
}

- (NSString *) summaryForQuestion:(Question *)question {
	return [NSString stringWithFormat:@"Undefined Answer"];
}

- (NSString *) description {
	return [NSString stringWithFormat:@"%@: %lu", [self class], questionId ];
}


@end
