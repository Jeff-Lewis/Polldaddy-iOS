//
//  ST_Address.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Question.h"

@interface ST_Address : Question {
	NSString *address1;
	NSString *address2;
	NSString *city;
	NSString *state;
	NSString *zip;
	NSString *country;
	boolean_t showZip;
	boolean_t showCountry;
    boolean_t showPlace;
    boolean_t showCity;
    boolean_t showState;
}

@property (nonatomic, strong) NSString *address1, *address2, *city, *state, *country, *zip;
@property (nonatomic, readonly) boolean_t showZip, showCountry, showPlace, showCity, showState;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)page;
- (NSString *) description;

@end
