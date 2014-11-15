//
//  ST_Html.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "ST_Html.h"
#import "RemoteResources.h"

@implementation ST_Html

@synthesize html;

- (boolean_t) isQuestion {
	return FALSE;
}

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];
	
	NSMutableString *tmp = [NSMutableString stringWithString:[TBXML elementText:@"chunk" parentElement:qnode withDefault:@""]];
	
	[tmp replaceOccurrencesOfString:@"&lt;" withString:@"<" options:NSLiteralSearch range:NSMakeRange(0, [tmp length])];
	[tmp replaceOccurrencesOfString:@"&gt;" withString:@">" options:NSLiteralSearch range:NSMakeRange(0, [tmp length])];
	[tmp replaceOccurrencesOfString:@"&amp;" withString:@"&" options:NSLiteralSearch range:NSMakeRange(0, [tmp length])];

	html = [NSString stringWithString:tmp];
	return self;
}

- (void)addResources:(RemoteResources *)resources {
    [super addResources:resources];
    
    NSError             *error = nil;
    NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"src=[\"'](.*?)[\"']" options:NSRegularExpressionCaseInsensitive error:&error];
     
    if ( html ) {
        NSArray *images = [regex matchesInString:html options:0 range:NSMakeRange(0, [html length])];
         
        for ( NSTextCheckingResult *match in images ) {
            if ( [resources alreadyExists:[html substringWithRange:[match rangeAtIndex:1]]] == NO )
                [resources addResource:[html substringWithRange:[match rangeAtIndex:1]]];
        }
    }
}

-(NSString *) description {
	return [NSString stringWithFormat:@"%@\nHTML=%@", [super description], html];
}

@end
