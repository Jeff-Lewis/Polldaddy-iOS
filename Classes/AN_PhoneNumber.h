//
//  AN_PhoneNumber.h
//  Polldaddy
//
//  Created by John Godley on 26/01/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Answer.h"

@class ST_PhoneNumber;

@interface AN_PhoneNumber : Answer {
	NSString *number;
}

- (Answer *) initWithXML:(TBXMLElement *)node;
- (NSString *) summaryForQuestion:(ST_PhoneNumber *)question;

@end
