//
//  ST_Name.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Question.h"

@interface ST_Name : Question {
	long       nameType;
	NSString *titleName;
	NSString *firstName;
	NSString *lastName;
	NSString *suffix;
}

@property (nonatomic, strong) NSString *titleName, *firstName, *lastName, *suffix;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(long)qType andPage:(unsigned long)thePage;
- (NSString *) description;
- (long) getNameType;

@end
