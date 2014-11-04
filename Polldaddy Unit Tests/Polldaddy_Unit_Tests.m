//
//  Polldaddy_Unit_Tests.m
//  Polldaddy Unit Tests
//
//  Created by John Godley on 19/01/2012.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "Polldaddy_Unit_Tests.h"
#import "Question.h"
#import "ST_MultiChoice.h"
#import "UI_MultiChoice.h"

@implementation Polldaddy_Unit_Tests

- (void)setUp {
    [super setUp];
    
    // Set-up code here.
}

- (void)tearDown {
    // Tear-down code here.
    
    [super tearDown];
}

/**
 * Create a multi-choice question and test that we can collect data from it
 */
- (void)testMultiChoice {
    NSString *sXML = @"<question qType='400' qID='2101185' trueQ='1' status='cur'><qText>Please enter your question here.</qText><nText>You can enter some information about this question here.</nText><note>false</note>"
                      "<other>false</other><rand>0</rand><elmType>0</elmType><options oType='list' oIDcounter='2'><option oID='4123702'>test</option><option oID='4123700'>Option 2</option>"
                      "</options><comments enabled='false'>Please help us understand why you selected this answer</comments><mand>false</mand></question>";
    
    TBXML *tbxml = [TBXML tbxmlWithXMLString:sXML];
    TBXMLElement *qXML = tbxml.rootXMLElement;

    ST_MultiChoice *question = [[ST_MultiChoice alloc] initWithXML:qXML andType:400 andPage:1];
    UI_MultiChoice *multi = [[UI_MultiChoice alloc] initWithQuestion:question andPack:nil];
    
    XCTAssertFalse( [multi hasOther]);
    XCTAssertEqual( question.questionType, (unsigned long)400);
    
    // Test limits
}

@end
