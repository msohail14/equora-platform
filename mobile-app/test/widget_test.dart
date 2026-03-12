import 'package:flutter_test/flutter_test.dart';
import 'package:horse_riding_app_design/main.dart';

void main() {
  testWidgets('App starts and shows Home Screen', (WidgetTester tester) async {
    await tester.pumpWidget(const EquestrianApp());
    await tester.pumpAndSettle();
    
    // Verify basic elements
    expect(find.text('Equestrian'), findsNothing); // Title is in MaterialApp, not visible text
    expect(find.text('Welcome back,'), findsOneWidget);
    expect(find.text('Jumping Training'), findsOneWidget);
  });
}
