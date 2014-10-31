//
//  ST_Html.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Question.h"


@interface ST_Html : Question {
	NSString *html;
}

@property (nonatomic, strong) NSString *html;

- (boolean_t) isQuestion;
- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage;
- (NSString *) description;

@end
