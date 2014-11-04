//
//  Language.m
//  Polldaddy
//
//  Created by John Godley on 02/08/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "Language.h"
#import "Survey.h"

@implementation Phrase

@synthesize phraseId, phrase;

-(Phrase *)initWithXML:(TBXMLElement *)xml {
    self = [super init];
    
    phraseId = [[TBXML valueOfAttributeNamed:@"phraseID" forElement:xml] integerValue];
    phrase   = [TBXML textForElement:xml];

    return self;
}


- (NSString *) description {
    return [NSString stringWithFormat:@"Phrase (%d) = %@", phraseId, phrase];
}

@end
@implementation Language

- (Language *)initForSurvey:(Survey *)survey {
    self = [super init];
    
    isSurvey = [survey isSurvey];
    phrases  = [[NSMutableDictionary alloc] init];
    
    NSArray  *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES); 
    NSString *packFile = [NSString stringWithFormat:@"%@/%lu/pack.xml", [paths objectAtIndex:0], survey.surveyId];

    NSFileManager *fileManager = [NSFileManager defaultManager];
    
    if ( [fileManager fileExistsAtPath:packFile isDirectory:nil] ) {
        NSData *data = [fileManager contentsAtPath:packFile];
        
       	TBXML *xml = [TBXML tbxmlWithXMLData:data];
        if ( xml ) {
            TBXMLElement *root = [xml rootXMLElement];
            
            if ( root ) {
                TBXMLElement *phrase = [TBXML childElementNamed:@"phrase" parentElement:root];
                Phrase       *item;
                
                // Go through the pages
                while ( phrase ) {
                    item = [[Phrase alloc] initWithXML:phrase];
                    
                    [phrases setObject:item forKey:[NSNumber numberWithInt:item.phraseId]];
                    
                    phrase = [TBXML nextSiblingNamed:@"phrase" searchFromElement:phrase];
                }
            }
        }
    }
    
    return self;
}

///start over
- (NSString *)getPhrase:(enum LanguagePhrases)phraseId {
    if ( [phrases objectForKey:[NSNumber numberWithInt:phraseId]] ) {
        return [[phrases objectForKey:[NSNumber numberWithInt:phraseId]] phrase];
    }
    else if ( isSurvey == YES ) {
        // Default phrase
        switch ( phraseId ) {
            case PHRASE_START:
                return NSLocalizedString( @"Start Survey", @"" );
                
            case PHRASE_END:
                return NSLocalizedString( @"End of Survey", @"" );
                
            case PHRASE_CANCEL:
                return NSLocalizedString( @"Cancel Survey", @"" );
                
            default:
                break;
        }
    }
    else if ( isSurvey == NO ) {
        // Default phrase
        switch ( phraseId ) {
            case PHRASE_QUIZ_PASSED:
                return NSLocalizedString( @"This means you passed!", @"" );
                
            case PHRASE_QUIZ_FAILED:
                return NSLocalizedString( @"This means you did not pass.", @"" );
                
            case PHRASE_START:
                return NSLocalizedString( @"Start Quiz", @"" );
                
            case PHRASE_END:
                return NSLocalizedString( @"End of Quiz", @"" );

            case PHRASE_CANCEL:
                return NSLocalizedString( @"Cancel Quiz", @"" );

            default:
                break;
        }
    }

    // These are neither survey or quiz specific
    switch ( phraseId ) {
        case PHRASE_CLOSE_CONFIRM:
            return NSLocalizedString( @"Are you sure you want to abandon this?", @"" );

        case PHRASE_MATRIX_ONE:
            return NSLocalizedString( @"You must pick one item from each row", @"" );

        case PHRASE_MATRIX_ATLEASTONE:
            return NSLocalizedString( @"You must pick at least one item from each row", @"" );
            
        case PHRASE_VALID_RESPONSE:
            return NSLocalizedString( @"Please enter a valid response", @"" );

        case PHRASE_VALID_EMAIL:
            return NSLocalizedString( @"You must enter a valid email", @"" );	

        case PHRASE_VALID_PHONE:
            return NSLocalizedString( @"Please enter a valid phone number", @"" );	
            
        case PHRASE_VALID_NUMBER:
            return NSLocalizedString( @"Value entered is not within range", @"" );	
            
        case PHRASE_SELECT_DATE:
            return NSLocalizedString( @"Select a date", @"" );

        case PHRASE_SELECT_TIME:
            return NSLocalizedString( @"Select a time", @"" );

        case PHRASE_TOOFEW:
            return NSLocalizedString( @"You need to select more choices", @"" );

        case PHRASE_TOOMANY:
            return NSLocalizedString( @"You have selected too many choices", @"" );

        case PHRASE_OTHER:
            return NSLocalizedString( @"Other:", @"" );
            
        case PHRASE_CONTINUE:
            return NSLocalizedString( @"Next", @"" );

        case PHRASE_CLOSE_CANCEL:
            return NSLocalizedString( @"Cancel", @"" );
            
        case PHRASE_CLOSE_YES:
            return NSLocalizedString( @"Yes", @"" );

        case PHRASE_MANDATORY:
            return NSLocalizedString( @"This question is mandatory", @"" );

        case PHRASE_STARTOVER:
            if ( [phrases objectForKey:[NSNumber numberWithInt:PHRASE_CANCEL]] )
                  return [[phrases objectForKey:[NSNumber numberWithInt:PHRASE_CANCEL]] phrase];
            return NSLocalizedString( @"Start Over", @"" );

        default:
            break;
    }
    
    return @"";
}


@end
