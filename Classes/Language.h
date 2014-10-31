//
//  Language.h
//  Polldaddy
//
//  Created by John Godley on 02/08/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TBXML.h"

@class Survey;

@interface Phrase : NSObject {
    unsigned int  phraseId;
    NSString     *phrase;
}

@property (nonatomic) unsigned int phraseId;
@property (nonatomic,readonly,strong) NSString *phrase;

- (Phrase *)initWithXML:(TBXMLElement *)xml;

@end

enum LanguagePhrases {
    PHRASE_CONTINUE = 1,
    PHRASE_START = 2,
    PHRASE_END = 3,
    PHRASE_VALID_RESPONSE = 4,
    PHRASE_MANDATORY = 5,
    PHRASE_VALID_EMAIL = 6,
    PHRASE_CANCEL = 9,
    PHRASE_OTHER  = 11,
    
    PHRASE_QUIZ_PASSED = 22,
    PHRASE_QUIZ_FAILED = 23,
    
    PHRASE_VALID_PHONE = 24,
    PHRASE_VALID_NUMBER = 26,
    
    PHRASE_TOOFEW = 30,
    PHRASE_TOOMANY = 31,
    
    // These dont yet exist on the site
    PHRASE_CLOSE_CONFIRM = 50,
    PHRASE_CLOSE_YES,
    PHRASE_CLOSE_CANCEL,
    PHRASE_STARTOVER,
    PHRASE_SELECT_DATE,
    PHRASE_SELECT_TIME,
    PHRASE_MATRIX_ATLEASTONE,
    PHRASE_MATRIX_ONE
};

@interface Language : NSObject {
    NSMutableDictionary *phrases;
    BOOL                 isSurvey;
}

- (Language *)initForSurvey:(Survey *)survey;
- (NSString *)getPhrase:(enum LanguagePhrases)phraseId;

@end

