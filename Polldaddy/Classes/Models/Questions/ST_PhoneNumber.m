//
//  ST_PhoneNumber.m
//  Polldaddy
//
//  Created by John Godley on 26/01/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "ST_PhoneNumber.h"
#import "NSString+XMLEntities.h"

@implementation ST_PhoneNumber

@synthesize example, canChangeCountry, countries, defaultCountry;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];
	
	example = [[TBXML elementText:@"example" parentElement:qnode withDefault:@""] stringByDecodingHTMLEntities];
	defaultCountry = [[TBXML elementText:@"default_country" parentElement:qnode withDefault:@""] stringByDecodingHTMLEntities];
	
	canChangeCountry = NO;
	if ( [[TBXML elementText:@"change_country" parentElement:qnode withDefault:@"false"] isEqualToString:@"true"] )
		canChangeCountry = YES;

	countries = [[NSMutableDictionary alloc] init];
	
	[countries setObject:@"Sierra Leone"  forKey:@"SL"];
	[countries setObject:@"Taiwan"  forKey:@"TW"];
	[countries setObject:@"Netherlands"  forKey:@"NL"];
	[countries setObject:@"Chile"  forKey:@"CL"];
	[countries setObject:@"Anguilla"  forKey:@"AI"];
	[countries setObject:@"Mauritius"  forKey:@"MU"];
	[countries setObject:@"Afghanistan"  forKey:@"AF"];
	[countries setObject:@"Andorra"  forKey:@"AD"];
	[countries setObject:@"Indonesia"  forKey:@"ID"];
	[countries setObject:@"Micronesia, Federated States of"  forKey:@"FM"];
	[countries setObject:@"United Kingdom"  forKey:@"GB"];
	[countries setObject:@"New Zealand"  forKey:@"NZ"];
	[countries setObject:@"Gabon"  forKey:@"GA"];
	[countries setObject:@"Puerto Rico"  forKey:@"PR"];
	[countries setObject:@"Equatorial Guinea"  forKey:@"GQ"];
	[countries setObject:@"Seychelles"  forKey:@"SC"];
	[countries setObject:@"Antarctica"  forKey:@"AQ"];
	[countries setObject:@"Saudi Arabia"  forKey:@"SA"];
	[countries setObject:@"Grenada"  forKey:@"GD"];
	[countries setObject:@"Antigua and Barbuda"  forKey:@"AG"];
	[countries setObject:@"Luxembourg"  forKey:@"LU"];
	[countries setObject:@"Denmark"  forKey:@"DK"];
	[countries setObject:@"China"  forKey:@"CN"];
	[countries setObject:@"Dominica"  forKey:@"DM"];
	[countries setObject:@"Mali"  forKey:@"ML"];
	[countries setObject:@"Montserrat"  forKey:@"MS"];
	[countries setObject:@"Russia"  forKey:@"RU"];
	[countries setObject:@"Asia/Pacific Region"  forKey:@"AP"];
	[countries setObject:@"Swaziland"  forKey:@"SZ"];
	[countries setObject:@"Europe"  forKey:@"EU"];
	[countries setObject:@"Somalia"  forKey:@"SO"];
	[countries setObject:@"Cameroon"  forKey:@"CM"];
	[countries setObject:@"Gambia"  forKey:@"GM"];
	[countries setObject:@"Qatar"  forKey:@"QA"];
	[countries setObject:@"Thailand"  forKey:@"TH"];
	[countries setObject:@"Cape Verde"  forKey:@"CV"];
	[countries setObject:@"Wallis and Futuna"  forKey:@"WF"];
	[countries setObject:@"Switzerland"  forKey:@"CH"];
	[countries setObject:@"Faroe Islands"  forKey:@"FO"];
	[countries setObject:@"Costa Rica"  forKey:@"CR"];
	[countries setObject:@"Samoa"  forKey:@"WS"];
	[countries setObject:@"Philippines"  forKey:@"PH"];
	[countries setObject:@"Pakistan"  forKey:@"PK"];
	[countries setObject:@"Slovakia"  forKey:@"SK"];
	[countries setObject:@"Zimbabwe"  forKey:@"ZW"];
	[countries setObject:@"Canada"  forKey:@"CA"];
	[countries setObject:@"United States Minor Outlying Islands"  forKey:@"UM"];
	[countries setObject:@"Germany"  forKey:@"DE"];
	[countries setObject:@"Rwanda"  forKey:@"RW"];
	[countries setObject:@"United Arab Emirates"  forKey:@"AE"];
	[countries setObject:@"Saint Kitts and Nevis"  forKey:@"KN"];
	[countries setObject:@"Virgin Islands, British"  forKey:@"VG"];
	[countries setObject:@"Cuba"  forKey:@"CU"];
	[countries setObject:@"Jordan"  forKey:@"JO"];
	[countries setObject:@"Togo"  forKey:@"TG"];
	[countries setObject:@"San Marino"  forKey:@"SM"];
	[countries setObject:@"Tokelau"  forKey:@"TK"];
	[countries setObject:@"Guinea"  forKey:@"GN"];
	[countries setObject:@"Barbados"  forKey:@"BB"];
	[countries setObject:@"Chad"  forKey:@"TD"];
	[countries setObject:@"Malawi"  forKey:@"MW"];
	[countries setObject:@"Suriname"  forKey:@"SR"];
	[countries setObject:@"Liechtenstein"  forKey:@"LI"];
	[countries setObject:@"Montenegro"  forKey:@"ME"];
	[countries setObject:@"Heard Island and McDonald Islands"  forKey:@"HM"];
	[countries setObject:@"Northern Mariana Islands"  forKey:@"MP"];
	[countries setObject:@"Dominican Republic"  forKey:@"DO"];
	[countries setObject:@"Belgium"  forKey:@"BE"];
	[countries setObject:@"Lao People's Democratic Republic"  forKey:@"LA"];
	[countries setObject:@"Poland"  forKey:@"PL"];
	[countries setObject:@"Israel"  forKey:@"IL"];
	[countries setObject:@"India"  forKey:@"IN"];
	[countries setObject:@"Guatemala"  forKey:@"GT"];
	[countries setObject:@"Martinique"  forKey:@"MQ"];
	[countries setObject:@"Myanmar"  forKey:@"MM"];
	[countries setObject:@"Morocco"  forKey:@"MA"];
	[countries setObject:@"Sudan"  forKey:@"SD"];
	[countries setObject:@"Netherlands Antilles"  forKey:@"AN"];
	[countries setObject:@"Liberia"  forKey:@"LR"];
	[countries setObject:@"Armenia"  forKey:@"AM"];
	[countries setObject:@"Cook Islands"  forKey:@"CK"];
	[countries setObject:@"Ethiopia"  forKey:@"ET"];
	[countries setObject:@"Marshall Islands"  forKey:@"MH"];
	[countries setObject:@"Saint Lucia"  forKey:@"LC"];
	[countries setObject:@"Guam"  forKey:@"GU"];
	[countries setObject:@"Estonia"  forKey:@"EE"];
	[countries setObject:@"Macedonia"  forKey:@"MK"];
	[countries setObject:@"Djibouti"  forKey:@"DJ"];
	[countries setObject:@"Austria"  forKey:@"AT"];
	[countries setObject:@"Zambia"  forKey:@"ZM"];
	[countries setObject:@"Cayman Islands"  forKey:@"KY"];
	[countries setObject:@"French Guiana"  forKey:@"GF"];
	[countries setObject:@"Guyana"  forKey:@"GY"];
	[countries setObject:@"Palau"  forKey:@"PW"];
	[countries setObject:@"Fiji"  forKey:@"FJ"];
	[countries setObject:@"Nauru"  forKey:@"NR"];
	[countries setObject:@"Greenland"  forKey:@"GL"];
	[countries setObject:@"Trinidad and Tobago"  forKey:@"TT"];
	[countries setObject:@"Ecuador"  forKey:@"EC"];
	[countries setObject:@"Lithuania"  forKey:@"LT"];
	[countries setObject:@"Serbia"  forKey:@"RS"];
	[countries setObject:@"Tajikistan"  forKey:@"TJ"];
	[countries setObject:@"Colombia"  forKey:@"CO"];
	[countries setObject:@"Australia"  forKey:@"AU"];
	[countries setObject:@"Ukraine"  forKey:@"UA"];
	[countries setObject:@"Nicaragua"  forKey:@"NI"];
	[countries setObject:@"Vietnam"  forKey:@"VN"];
	[countries setObject:@"Saint Vincent and the Grenadines"  forKey:@"VC"];
	[countries setObject:@"Peru"  forKey:@"PE"];
	[countries setObject:@"Uruguay"  forKey:@"UY"];
	[countries setObject:@"Monaco"  forKey:@"MC"];
	[countries setObject:@"Bosnia and Herzegovina"  forKey:@"BA"];
	[countries setObject:@"Greece"  forKey:@"GR"];
	[countries setObject:@"Libyan Arab Jamahiriya"  forKey:@"LY"];
	[countries setObject:@"Finland"  forKey:@"FI"];
	[countries setObject:@"Bhutan"  forKey:@"BT"];
	[countries setObject:@"Algeria"  forKey:@"DZ"];
	[countries setObject:@"Central African Republic"  forKey:@"CF"];
	[countries setObject:@"Croatia"  forKey:@"HR"];
	[countries setObject:@"Bolivia"  forKey:@"BO"];
	[countries setObject:@"Senegal"  forKey:@"SN"];
	[countries setObject:@"Argentina"  forKey:@"AR"];
	[countries setObject:@"Reunion"  forKey:@"RE"];
	[countries setObject:@"Norway"  forKey:@"NO"];
	[countries setObject:@"Sri Lanka"  forKey:@"LK"];
	[countries setObject:@"Tuvalu"  forKey:@"TV"];
	[countries setObject:@"Namibia"  forKey:@"NA"];
	[countries setObject:@"Georgia"  forKey:@"GE"];
	[countries setObject:@"Turks and Caicos Islands"  forKey:@"TC"];
	[countries setObject:@"Holy See (Vatican City State)"  forKey:@"VA"];
	[countries setObject:@"Sweden"  forKey:@"SE"];
	[countries setObject:@"Iran, Islamic Republic of"  forKey:@"IR"];
	[countries setObject:@"Mexico"  forKey:@"MX"];
	[countries setObject:@"Mauritania"  forKey:@"MR"];
	[countries setObject:@"Comoros"  forKey:@"KM"];
	[countries setObject:@"Moldova, Republic of"  forKey:@"MD"];
	[countries setObject:@"Tanzania, United Republic of"  forKey:@"TZ"];
	[countries setObject:@"Ireland"  forKey:@"IE"];
	[countries setObject:@"Kazakstan"  forKey:@"KZ"];
	[countries setObject:@"United States"  forKey:@"US"];
	[countries setObject:@"Bulgaria"  forKey:@"BG"];
	[countries setObject:@"El Salvador"  forKey:@"SV"];
	[countries setObject:@"Botswana"  forKey:@"BW"];
	[countries setObject:@"France"  forKey:@"FR"];
	[countries setObject:@"South Africa"  forKey:@"ZA"];
	[countries setObject:@"Paraguay"  forKey:@"PY"];
	[countries setObject:@"Iraq"  forKey:@"IQ"];
	[countries setObject:@"Macau"  forKey:@"MO"];
	[countries setObject:@"Singapore"  forKey:@"SG"];
	[countries setObject:@"Bahrain"  forKey:@"BH"];
	[countries setObject:@"Sao Tome and Principe"  forKey:@"ST"];
	[countries setObject:@"Venezuela"  forKey:@"VE"];
	[countries setObject:@"Lebanon"  forKey:@"LB"];
	[countries setObject:@"Falkland Islands (Malvinas)"  forKey:@"FK"];
	[countries setObject:@"British Indian Ocean Territory"  forKey:@"IO"];
	[countries setObject:@"Japan"  forKey:@"JP"];
	[countries setObject:@"Bangladesh"  forKey:@"BD"];
	[countries setObject:@"Romania"  forKey:@"RO"];
	[countries setObject:@"Ghana"  forKey:@"GH"];
	[countries setObject:@"Brunei Darussalam"  forKey:@"BN"];
	[countries setObject:@"Papua New Guinea"  forKey:@"PG"];
	[countries setObject:@"American Samoa"  forKey:@"AS"];
	[countries setObject:@"Azerbaijan"  forKey:@"AZ"];
	[countries setObject:@"Panama"  forKey:@"PA"];
	[countries setObject:@"Belize"  forKey:@"BZ"];
	[countries setObject:@"Vanuatu"  forKey:@"VU"];
	[countries setObject:@"Portugal"  forKey:@"PT"];
	[countries setObject:@"Guinea-Bissau"  forKey:@"GW"];
	[countries setObject:@"Turkmenistan"  forKey:@"TM"];
	[countries setObject:@"Uzbekistan"  forKey:@"UZ"];
	[countries setObject:@"Tunisia"  forKey:@"TN"];
	[countries setObject:@"New Caledonia"  forKey:@"NC"];
	[countries setObject:@"Latvia"  forKey:@"LV"];
	[countries setObject:@"Aruba"  forKey:@"AW"];
	[countries setObject:@"Nigeria"  forKey:@"NG"];
	[countries setObject:@"Italy"  forKey:@"IT"];
	[countries setObject:@"Tonga"  forKey:@"TO"];
	[countries setObject:@"Yemen"  forKey:@"YE"];
	[countries setObject:@"Bahamas"  forKey:@"BS"];
	[countries setObject:@"Eritrea"  forKey:@"ER"];
	[countries setObject:@"Nepal"  forKey:@"NP"];
	[countries setObject:@"French Polynesia"  forKey:@"PF"];
	[countries setObject:@"Korea, Democratic People's Republic of"  forKey:@"KP"];
	[countries setObject:@"Syrian Arab Republic"  forKey:@"SY"];
	[countries setObject:@"Bouvet Island"  forKey:@"BV"];
	[countries setObject:@"Virgin Islands, U.S."  forKey:@"VI"];
	[countries setObject:@"Cambodia"  forKey:@"KH"];
	[countries setObject:@"Cyprus"  forKey:@"CY"];
	[countries setObject:@"Niue"  forKey:@"NU"];
	[countries setObject:@"Mozambique"  forKey:@"MZ"];
	[countries setObject:@"Oman"  forKey:@"OM"];
	[countries setObject:@"Guadeloupe"  forKey:@"GP"];
	[countries setObject:@"Belarus"  forKey:@"BY"];
	[countries setObject:@"Hong Kong"  forKey:@"HK"];
	[countries setObject:@"Satellite Provider"  forKey:@"A2"];
	[countries setObject:@"Kenya"  forKey:@"KE"];
	[countries setObject:@"Madagascar"  forKey:@"MG"];
	[countries setObject:@"Solomon Islands"  forKey:@"SB"];
	[countries setObject:@"Czech Republic"  forKey:@"CZ"];
	[countries setObject:@"Angola"  forKey:@"AO"];
	[countries setObject:@"Palestinian Territory, Occupied"  forKey:@"PS"];
	[countries setObject:@"Gibraltar"  forKey:@"GI"];
	[countries setObject:@"Honduras"  forKey:@"HN"];
	[countries setObject:@"Uganda"  forKey:@"UG"];
	[countries setObject:@"Malta"  forKey:@"MT"];
	[countries setObject:@"Cote D'Ivoire"  forKey:@"CI"];
	[countries setObject:@"Slovenia"  forKey:@"SI"];
	[countries setObject:@"Niger"  forKey:@"NE"];
	[countries setObject:@"Brazil"  forKey:@"BR"];
	[countries setObject:@"Burundi"  forKey:@"BI"];
	[countries setObject:@"Maldives"  forKey:@"MV"];
	[countries setObject:@"Congo, The Democratic Republic of"  forKey:@"CD"];
	[countries setObject:@"Anonymous Proxy"  forKey:@"A1"];
	[countries setObject:@"Turkey"  forKey:@"TR"];
	[countries setObject:@"Mongolia"  forKey:@"MN"];
	[countries setObject:@"Hungary"  forKey:@"HU"];
	[countries setObject:@"Benin"  forKey:@"BJ"];
	[countries setObject:@"Jamaica"  forKey:@"JM"];
	[countries setObject:@"Haiti"  forKey:@"HT"];
	[countries setObject:@"Kyrgyzstan"  forKey:@"KG"];
	[countries setObject:@"Spain"  forKey:@"ES"];
	[countries setObject:@"Malaysia"  forKey:@"MY"];
	[countries setObject:@"Norfolk Island"  forKey:@"NF"];
	[countries setObject:@"Iceland"  forKey:@"IS"];
	[countries setObject:@"Korea, Republic of"  forKey:@"KR"];
	[countries setObject:@"Kuwait"  forKey:@"KW"];
	[countries setObject:@"Egypt"  forKey:@"EG"];
	[countries setObject:@"Albania"  forKey:@"AL"];
	[countries setObject:@"Burkina Faso"  forKey:@"BF"];
	[countries setObject:@"Bermuda"  forKey:@"BM"];
	[countries setObject:@"Kiribati"  forKey:@"KI"];
	[countries setObject:@"Mayotte"  forKey:@"YT"];
	[countries setObject:@"Lesotho"  forKey:@"LS"];
	[countries setObject:@"Congo"  forKey:@"CG"];
	
	return self;
}

-(NSString *) getCountryForCode:(NSString *)code {
	return [countries objectForKey:code];
}

-(NSString *) getDefaultCountry {
	return [self getCountryForCode:defaultCountry];
}

-(NSString *) description {
	return [NSString stringWithFormat:@"%@\n", [super description]];
}


@end
