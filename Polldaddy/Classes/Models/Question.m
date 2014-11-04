//
//  Question.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "RemoteResources.h"
#import "NSString+XMLEntities.h"
#import "Question.h"
#import "Rule.h"
#import "ST_Text.h"
#import "ST_Name.h"
#import "ST_Address.h"
#import "ST_DateTime.h"
#import "ST_Matrix.h"
#import "ST_EmailAddress.h"
#import "ST_Url.h"
#import "ST_PageHeader.h"
#import "ST_Html.h"
#import "ST_MultiChoice.h"
#import "ST_FileUpload.h"
#import "ST_PhoneNumber.h"
#import "ST_Number.h"

@implementation Question

@synthesize title, surveyId, questionType, questionNumber, questionId, note, rules, page, realQnum;

+ (Question *) allocQuestion: (TBXMLElement *)qnode onPage:(unsigned long)page {
	NSUInteger       questionType;
	Question *obj;
	
	// Basic question info
	questionType = [[TBXML valueOfAttributeNamed:@"qType" forElement:qnode] integerValue];

	switch ( questionType ) {
		case 100:
		case 200:
				obj = [ST_Text alloc];
				break;

		case 400: obj = [ST_MultiChoice alloc];
			break;

		case 800: obj = [ST_Name alloc];
				break;

		case 900: obj = [ST_Address alloc];
				break;

		case 950: obj = [ST_PhoneNumber alloc];
			break;
			
		case 1000: obj = [ST_DateTime alloc];
				break;
			
		case 1100: obj = [ST_Number alloc];
			break;
			
		case 1200: obj = [ST_Matrix alloc];
				break;
			
		case 1400: obj = [ST_EmailAddress alloc];
				break;
			
		case 1500: obj = [ST_Url alloc];
				break;

		case 1600: obj = [ST_FileUpload alloc];
			break;

		case 1900: obj = [ST_PageHeader alloc];
				break;
			
		case 2000: obj = [ST_Html alloc];
			break;
			
		default:
			return nil;
	}

	// Is it a real question? If so then increment the question number
	return [obj initWithXML:qnode andType:questionType andPage:page];
}

- (Question *)initWithXML:(TBXMLElement *)qnode andType:(unsigned long)qType andPage:(unsigned long)thePage {
	self = [super init];

	rules = [[NSMutableArray alloc] init];

	page         = thePage;
	questionType = qType;
	questionId   = [[TBXML valueOfAttributeNamed:@"qID" forElement:qnode] integerValue];

	// Question title
	self.title = [[TBXML elementText:@"qText" parentElement:qnode withDefault:@"Survey"] stringByDecodingHTMLEntities];
	self.note = nil;
	
	// Question note
	TBXMLElement *noteNode = [TBXML childElementNamed:@"note" parentElement:qnode];
	 
	if ( [[TBXML textForElement:noteNode] isEqualToString:@"true"] )
		self.note = [[[TBXML elementText:@"nText" parentElement:qnode withDefault:@""] stringByDecodingHTMLEntities] stringWithNewLinesAsBRs];

	// Mandatory
	isMandatory = FALSE;
	if ( [[TBXML elementText:@"mand" parentElement:qnode withDefault:@"false"] isEqualToString:@"true"] )
		isMandatory = TRUE;
	
	return self;
}

-(NSString *) description {
	return [NSString stringWithFormat:@"%@: %lu, title=%@, note=%@, mand=%@, page=%lu, rules=%lu", [self class], questionId, title, note, [self isMandatory] ? @"true" : @"false", page, (unsigned long)[rules count] ];
}

- (boolean_t) isMandatory {
 	return isMandatory;
}

- (boolean_t) isQuestion {
	return TRUE;
}

- (boolean_t) hasNote {
	return [note length] > 0 ? TRUE : FALSE;
}

- (void)applyRules:(NSMutableArray *)actions withAnswer:(UI_Question *)answer {
	for ( Rule *rule in rules ) {
		if ( [rule applyWithQuestion:self withAnswer:answer] )
			[actions addObject:rule];
	}
}

- (NSString *)getResourcePath:(unsigned long)surveyID {
    NSArray  *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES); 
    
    return [NSString stringWithFormat:@"%@/%lu/", [paths objectAtIndex:0], surveyID ];
}

- (NSString *)allocLocalizeString:(NSString *)str andSurveyId:(unsigned long)theSurveyId {
    // Localize the note
    NSError             *error = nil;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"src=[\"'](.*?)[\"']" options:NSRegularExpressionCaseInsensitive error:&error];
    
    NSArray             *images = [regex matchesInString:str options:0 range:NSMakeRange(0, [str length])];
    NSMutableString     *new_str = [[NSMutableString alloc] initWithString:str];
    
    NSString *matched, *replace, *local;
    
    NSFileManager *fileManager = [NSFileManager defaultManager];
    
    for ( NSTextCheckingResult *match in images ) {
        matched = [str substringWithRange:[match rangeAtIndex:0]];
        
        // Try it with jpeg
        local = [NSString stringWithFormat:@"%@%@.jpg", [self getResourcePath:theSurveyId], [RemoteContent localName:[str substringWithRange:[match rangeAtIndex:1]]]];
        
        if ( [fileManager fileExistsAtPath:local isDirectory:nil] == NO ) {
            local = [NSString stringWithFormat:@"%@%@.png", [self getResourcePath:theSurveyId], [RemoteContent localName:[str substringWithRange:[match rangeAtIndex:1]]]];
            
            if ( [fileManager fileExistsAtPath:local isDirectory:nil] == NO ) {
                local = [NSString stringWithFormat:@"%@%@.gif", [self getResourcePath:theSurveyId], [RemoteContent localName:[str substringWithRange:[match rangeAtIndex:1]]]];
                
                if ( [fileManager fileExistsAtPath:local isDirectory:nil] == NO ) {
                    local = nil;
                }
            }
        }
        
        if ( local ) {
            // Does this exist in the filesystem?
            replace = [NSString stringWithFormat:@"src=\"%@\"", local];
            
            [new_str replaceOccurrencesOfString:matched withString:replace options:NSLiteralSearch range:NSMakeRange(0, [new_str length])];
        }
    }
    
    return new_str;
}

- (void)localize:(unsigned long)theSurveyId {
    if ( note == nil )
        return;

    note = [self allocLocalizeString:note andSurveyId:theSurveyId];
}

- (void)addResources:(RemoteResources *)resources {
    NSError             *error = nil;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"src=[\"'](.*?)[\"']" options:NSRegularExpressionCaseInsensitive error:&error];

    if ( note ) {
        NSArray *images = [regex matchesInString:note options:0 range:NSMakeRange(0, [note length])];
        
        for ( NSTextCheckingResult *match in images ) {
            if ( [resources alreadyExists:[note substringWithRange:[match rangeAtIndex:1]]] == NO )
                [resources addResource:[note substringWithRange:[match rangeAtIndex:1]]];
        }
    }
}


@end
