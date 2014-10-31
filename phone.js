function phone_as_xml( string, region ) {
  try {
  	var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
  	var number = phoneUtil.parse( string, region );

  	return phoneUtil.isValidNumber( number );
  }
  catch ( e ) {
    return false;
  }
}
