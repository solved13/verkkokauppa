// Дашборд для звітів тестування verkkokauppa.
//
// Що робить цей файл: раз в кілька секунд (або за натиском кнопки) звертається
// по інтернету до results.json, який публікує GitHub Actions на GitHub Pages,
// і показує коротку статистику — скільки тестів пройшло/впало — у вигляді
// великих цифр і простого графіка.
//
// Ключові поняття Flutter, які тут використані (для розуміння, не тільки копіювання):
// - StatefulWidget / State — віджет, що має "пам'ять" (стан), яка може змінюватись
//   з часом (у нас стан — це "чи йде завантаження", "останній звіт", "помилка").
// - setState(() {...}) — єдиний спосіб сказати Flutter "дані змінились,
//   перемалюй екран". Без setState зміна змінної нічого не покаже на екрані.
// - async/await — так само, як у JavaScript: http.get(...) повертає Future
//   (аналог Promise), await чекає на результат, не блокуючи інтерфейс.
// - build(context) — метод, який Flutter викликає щоразу, коли треба
//   перемалювати віджет; тут ми просто описуємо, як виглядає екран ЗАРАЗ,
//   виходячи з поточного стану (це називається "декларативний UI").

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

// Адреса, звідки CI публікує JSON-звіт після кожного запуску тестів.
// Заміни на свій логін/репозиторій, якщо відрізняється.
const String reportUrl = 'https://solved13.github.io/verkkokauppa/results.json';

void main() {
  runApp(const DashboardApp());
}

class DashboardApp extends StatelessWidget {
  const DashboardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Verkkokauppa — Testiraportit',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF1565C0),
        useMaterial3: true,
      ),
      home: const DashboardPage(),
    );
  }
}

// ------------------------------------------------------------
// Модель даних: невеликий клас, що бере "сирий" JSON від Playwright
// і перетворює його на зручні для UI поля.
// ------------------------------------------------------------
class TestReport {
  final int passed;
  final int failed;
  final int skipped;
  final int flaky;
  final double durationMs;
  final DateTime? startTime;
  final List<String> failingTitles;

  TestReport({
    required this.passed,
    required this.failed,
    required this.skipped,
    required this.flaky,
    required this.durationMs,
    required this.startTime,
    required this.failingTitles,
  });

  int get total => passed + failed + skipped + flaky;

  factory TestReport.fromJson(Map<String, dynamic> json) {
    final stats = json['stats'] as Map<String, dynamic>? ?? {};

    // Playwright зберігає тести вкладено: suites -> (вкладені suites) -> specs -> tests.
    // Рекурсивно проходимось по всьому дереву і збираємо назви тих specs,
    // де ok == false (тобто хоч один тест у ньому не пройшов).
    final List<String> failing = [];

    void walkSuites(List<dynamic>? suites, String pathPrefix) {
      if (suites == null) return;
      for (final s in suites) {
        final suite = s as Map<String, dynamic>;
        final title = suite['title'] as String? ?? '';
        final newPrefix = pathPrefix.isEmpty ? title : '$pathPrefix › $title';

        final specs = suite['specs'] as List<dynamic>? ?? [];
        for (final sp in specs) {
          final spec = sp as Map<String, dynamic>;
          final ok = spec['ok'] as bool? ?? true;
          if (!ok) {
            final specTitle = spec['title'] as String? ?? 'без назви';
            failing.add('$newPrefix › $specTitle');
          }
        }

        walkSuites(suite['suites'] as List<dynamic>?, newPrefix);
      }
    }

    walkSuites(json['suites'] as List<dynamic>?, '');

    DateTime? started;
    final rawStart = stats['startTime'] as String?;
    if (rawStart != null) {
      started = DateTime.tryParse(rawStart);
    }

    return TestReport(
      passed: (stats['expected'] as num?)?.toInt() ?? 0,
      failed: (stats['unexpected'] as num?)?.toInt() ?? 0,
      skipped: (stats['skipped'] as num?)?.toInt() ?? 0,
      flaky: (stats['flaky'] as num?)?.toInt() ?? 0,
      durationMs: (stats['duration'] as num?)?.toDouble() ?? 0,
      startTime: started,
      failingTitles: failing,
    );
  }
}

// ------------------------------------------------------------
// Головний екран
// ------------------------------------------------------------
class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  bool _loading = true;
  String? _error;
  TestReport? _report;

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Додаємо параметр _t, щоб GitHub Pages / браузер не віддав закешовану
      // стару версію файлу замість свіжої.
      final uri = Uri.parse(
        '$reportUrl?_t=${DateTime.now().millisecondsSinceEpoch}',
      );
      final response = await http.get(uri).timeout(const Duration(seconds: 15));

      if (response.statusCode != 200) {
        throw Exception('Сервер повернув код ${response.statusCode}');
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      final report = TestReport.fromJson(data);

      setState(() {
        _report = report;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Не вдалося завантажити звіт: $e';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Verkkokauppa — Testiraportit'),
        actions: [
          IconButton(
            onPressed: _loading ? null : _loadReport,
            icon: const Icon(Icons.refresh),
            tooltip: 'Оновити',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadReport,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading && _report == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null && _report == null) {
      return ListView(
        // ListView (не Column) — щоб RefreshIndicator (потягнути вниз, щоб
        // оновити) працював навіть коли контенту мало і він не скролиться.
        children: [
          const SizedBox(height: 120),
          Icon(Icons.error_outline, size: 48, color: Colors.red.shade400),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: ElevatedButton(
              onPressed: _loadReport,
              child: const Text('Спробувати ще раз'),
            ),
          ),
        ],
      );
    }

    final report = _report!;

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _StatRow(report: report),
        const SizedBox(height: 24),
        _PassFailBar(passed: report.passed, failed: report.failed, skipped: report.skipped),
        const SizedBox(height: 24),
        _MetaInfo(report: report),
        if (report.failingTitles.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text(
            'Провалені тести (${report.failingTitles.length})',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          ...report.failingTitles.map(
            (title) => Card(
              color: Colors.red.shade50,
              child: ListTile(
                leading: Icon(Icons.close, color: Colors.red.shade700),
                title: Text(title),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

// ------------------------------------------------------------
// Дрібні віджети екрану — винесені окремо, щоб build() вище не був
// одним величезним шматком коду.
// ------------------------------------------------------------

class _StatRow extends StatelessWidget {
  final TestReport report;
  const _StatRow({required this.report});

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        _StatCard(label: 'Всього', value: report.total, color: Colors.blueGrey),
        _StatCard(label: 'Пройшло', value: report.passed, color: Colors.green),
        _StatCard(label: 'Впало', value: report.failed, color: Colors.red),
        if (report.skipped > 0)
          _StatCard(label: 'Пропущено', value: report.skipped, color: Colors.orange),
        if (report.flaky > 0)
          _StatCard(label: 'Нестабільні', value: report.flaky, color: Colors.purple),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final int value;
  final Color color;

  const _StatCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(
            '$value',
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: color),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 14)),
        ],
      ),
    );
  }
}

// Простий горизонтальний графік: одна смуга, поділена пропорційно
// на пройдені/провалені/пропущені тести. Без зовнішніх бібліотек для
// графіків — просто Row з Expanded(flex: ...), де flex і є значенням.
class _PassFailBar extends StatelessWidget {
  final int passed;
  final int failed;
  final int skipped;

  const _PassFailBar({required this.passed, required this.failed, required this.skipped});

  @override
  Widget build(BuildContext context) {
    final total = passed + failed + skipped;
    if (total == 0) {
      return const Text('Немає даних для графіка');
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        height: 28,
        child: Row(
          children: [
            if (passed > 0) Expanded(flex: passed, child: Container(color: Colors.green)),
            if (failed > 0) Expanded(flex: failed, child: Container(color: Colors.red)),
            if (skipped > 0) Expanded(flex: skipped, child: Container(color: Colors.orange)),
          ],
        ),
      ),
    );
  }
}

class _MetaInfo extends StatelessWidget {
  final TestReport report;
  const _MetaInfo({required this.report});

  @override
  Widget build(BuildContext context) {
    final seconds = (report.durationMs / 1000).toStringAsFixed(1);
    final started = report.startTime;
    final startedText = started == null
        ? '—'
        : '${started.day.toString().padLeft(2, '0')}.'
            '${started.month.toString().padLeft(2, '0')}.'
            '${started.year} '
            '${started.hour.toString().padLeft(2, '0')}:'
            '${started.minute.toString().padLeft(2, '0')}';

    return Wrap(
      spacing: 24,
      runSpacing: 8,
      children: [
        Text('Тривалість запуску: $seconds с'),
        Text('Останній запуск: $startedText'),
      ],
    );
  }
}
