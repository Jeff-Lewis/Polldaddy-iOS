//
//  ST_EmailAddress.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Question.h"

@interface ST_EmailAddress : Question {
	NSString *example;
}

@property (nonatomic, strong) NSString *example;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage;
- (NSString *) description;

@end
