import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../services/share_service.dart';

class SharedFilesScreen extends StatefulWidget {
  const SharedFilesScreen({super.key});

  @override
  State<SharedFilesScreen> createState() =>
      _SharedFilesScreenState();
}

class _SharedFilesScreenState
    extends State<SharedFilesScreen> {
  final ShareService _shareService =
      ShareService();

  List<dynamic> shares = [];

  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    loadShares();
  }

  Future<void> loadShares() async {
    try {
      final result =
          await _shareService.getSharedFiles();

      debugPrint('SHARES => $result');

      setState(() {
        shares = result;
        error = null;
        isLoading = false;
      });
    } catch (e) {
      debugPrint('SHARE ERROR => $e');

      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  Future<void> copyLink(
    String token,
  ) async {
    final url =
        'https://zhdrive.in/share/$token';

    await Clipboard.setData(
      ClipboardData(
        text: url,
      ),
    );

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Link copied',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const SafeArea(
        child: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (error != null) {
      return SafeArea(
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: Text(
              error!,
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: loadShares,
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [
            Padding(
              padding:
                  const EdgeInsets.fromLTRB(
                20,
                20,
                20,
                10,
              ),
              child: Text(
                'Shared (${shares.length})',
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight:
                      FontWeight.bold,
                ),
              ),
            ),

            Expanded(
              child: shares.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(
                          height: 250,
                        ),
                        Center(
                          child: Text(
                            'No shared files',
                            style: TextStyle(
                              fontSize: 18,
                            ),
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      itemCount:
                          shares.length,
                      itemBuilder:
                          (context, index) {
                        final share =
                            shares[index];

                        final file =
                            share['file'];

                        return Card(
                          margin:
                              const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          child: ListTile(
                            leading:
                                const Icon(
                              Icons.share,
                            ),
                            title: Text(
                              file['name'] ??
                                  'Unknown File',
                            ),
                            subtitle:
                                Text(
                              share['token'] ??
                                  '',
                              maxLines: 1,
                              overflow:
                                  TextOverflow
                                      .ellipsis,
                            ),
                            trailing:
                                IconButton(
                              icon:
                                  const Icon(
                                Icons.copy,
                              ),
                              onPressed:
                                  () {
                                copyLink(
                                  share[
                                      'token'],
                                );
                              },
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}