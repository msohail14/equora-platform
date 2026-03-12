import 'package:flutter_test/flutter_test.dart';
import 'package:equestrian_app/main.dart';

void main() {
  testWidgets('App starts and shows landing screen', (WidgetTester tester) async {
    await tester.pumpWidget(const EquestrianApp());
    await tester.pump(const Duration(seconds: 1));

    expect(find.text('Equestrian'), findsOneWidget);
    expect(find.text('Premium Equestrian Management'), findsOneWidget);
  });
}
