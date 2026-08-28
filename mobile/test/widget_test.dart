import 'package:flutter_test/flutter_test.dart';
import 'package:sms_reader/main.dart';

void main() {
  testWidgets('App launches smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const SecureSmsApp());
    expect(find.byType(SecureSmsApp), findsOneWidget);
    await tester.pump(const Duration(seconds: 2));
  });
}


