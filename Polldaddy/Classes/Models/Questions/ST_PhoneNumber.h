//
//  ST_PhoneNumber.h
//  Polldaddy
//
//  Created by John Godley on 26/01/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "Question.h"

@interface ST_PhoneNumber : Question {
	NSString *example;
	NSString *defaultCountry;
	
	NSMutableDictionary *countries;

	BOOL canChangeCountry;
}

@property (nonatomic, strong, readonly) NSString *example, *defaultCountry;
@property (nonatomic, readonly) BOOL canChangeCountry;
@property (nonatomic, readonly) NSMutableDictionary *countries;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage;
- (NSString *) getDefaultCountry;
- (NSString *) description;
@end
