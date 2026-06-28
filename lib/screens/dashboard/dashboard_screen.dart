import 'package:flutter/material.dart';

import '../../models/file_item.dart';
import '../../models/user.dart';
import '../../services/files_service.dart';
import '../../services/user_service.dart';
import '../files/trash_screen.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int) onNavigate;

  const DashboardScreen({
    super.key,
    required this.onNavigate,
  });

  @override
  State<DashboardScreen> createState() =>
      _DashboardScreenState();
}

class _DashboardScreenState
    extends State<DashboardScreen> {
final UserService _userService = UserService();
final FilesService _filesService = FilesService();

User? user;

List<FileItem> recentFiles = [];

bool isLoading = true;
bool isUploading = false;

String? error;

@override
void initState() {
super.initState();
loadDashboard();
}

Future<void> loadDashboard() async {
try {
final currentUser =
await _userService.getCurrentUser();

final files =
await _filesService.getFiles();

setState(() {
user = currentUser;
recentFiles = files.take(5).toList();
isLoading = false;
});
} catch (e) {
setState(() {
error = e.toString();
isLoading = false;
});
}
}

Future<void> uploadFile() async {
try {
setState(() {
isUploading = true;
});

final uploaded =
await _filesService.pickAndUploadFile();

if (!mounted) return;

if (uploaded) {
ScaffoldMessenger.of(context).showSnackBar(
const SnackBar(
content: Text(
'File uploaded successfully',
),
),
);

widget.onNavigate(1);
}
} catch (e) {
if (!mounted) return;

ScaffoldMessenger.of(context).showSnackBar(
SnackBar(
content: Text(e.toString()),
),
);
} finally {
if (mounted) {
setState(() {
isUploading = false;
});
}
}
}

void openTrash() {
Navigator.push(
context,
MaterialPageRoute(
builder: (_) => const TrashScreen(),
),
);
}

String formatStorage(int bytes) {
const gb = 1024 * 1024 * 1024;

if (bytes < gb) {
return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
}

return '${(bytes / gb).toStringAsFixed(2)} GB';
}

String formatSize(int bytes) {
if (bytes < 1024) {
return '$bytes B';
}

if (bytes < 1024 * 1024) {
return '${(bytes / 1024).toStringAsFixed(1)} KB';
}

return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}

String greeting() {
final hour = DateTime.now().hour;

if (hour < 12) return "Good Morning";

if (hour < 17) return "Good Afternoon";

return "Good Evening";
}

IconData fileIcon(String mime) {
if (mime.contains('image')) {
return Icons.image;
}

if (mime.contains('pdf')) {
return Icons.picture_as_pdf;
}

if (mime.contains('video')) {
return Icons.video_file;
}

if (mime.contains('zip')) {
return Icons.folder_zip;
}

if (mime.contains('word')) {
return Icons.description;
}

return Icons.insert_drive_file;
}

@override
Widget build(BuildContext context) {
if (isLoading) {
return const Center(
child: CircularProgressIndicator(),
);
}

if (error != null) {
return Center(
child: Text(error!),
);
}

final usage =
user!.storageUsed / user!.storageLimit;

return RefreshIndicator(
onRefresh: loadDashboard,
child: SingleChildScrollView(
physics:
const AlwaysScrollableScrollPhysics(),
padding: const EdgeInsets.fromLTRB(
20,
60,
20,
30,
),
child: Column(
crossAxisAlignment:
CrossAxisAlignment.start,
children: [
Text(
greeting(),
style: TextStyle(
color: Colors.grey.shade600,
fontSize: 16,
),
),

const SizedBox(height: 8),

const Text(
"ZDrive",
style: TextStyle(
fontSize: 34,
fontWeight: FontWeight.bold,
),
),

const SizedBox(height: 6),

Text(
user!.email,
style: TextStyle(
color: Colors.grey.shade700,
),
),

const SizedBox(height: 28),

Container(
width: double.infinity,
padding: const EdgeInsets.all(22),
decoration: BoxDecoration(
color: Colors.blue.shade50,
borderRadius:
BorderRadius.circular(24),
),
child: Column(
crossAxisAlignment:
CrossAxisAlignment.start,
children: [
Row(
mainAxisAlignment:
MainAxisAlignment
.spaceBetween,
children: [
const Text(
"Storage",
style: TextStyle(
fontSize: 18,
fontWeight:
FontWeight.bold,
),
),
Chip(
label: Text(user!.plan),
),
],
),

const SizedBox(height: 18),

Text(
formatStorage(
user!.storageUsed,
),
style: const TextStyle(
fontSize: 32,
fontWeight:
FontWeight.bold,
),
),

const SizedBox(height: 6),

Text(
"of ${formatStorage(user!.storageLimit)} used",
),

const SizedBox(height: 20),

ClipRRect(
borderRadius:
BorderRadius.circular(8),
child:
LinearProgressIndicator(
minHeight: 10,
value: usage,
),
),

const SizedBox(height: 8),

Text(
"${(usage * 100).toStringAsFixed(1)}% Used",
),
],
),
),

const SizedBox(height: 28),

const Text(
"Quick Actions",
style: TextStyle(
fontSize: 20,
fontWeight:
FontWeight.bold,
),
),

const SizedBox(height: 16),

GridView.count(
shrinkWrap: true,
physics:
const NeverScrollableScrollPhysics(),
crossAxisCount: 2,
mainAxisSpacing: 12,
crossAxisSpacing: 12,
childAspectRatio: 1.6,
children: [
_ActionCard(
icon: Icons.folder,
title: "My Files",
onTap: () {
widget.onNavigate(1);
},
),

_ActionCard(
icon: Icons.upload,
title: "Upload",
onTap: isUploading
? () {}
: uploadFile,
),

_ActionCard(
icon: Icons.share,
title: "Shared",
onTap: () {
widget.onNavigate(2);
},
),

_ActionCard(
icon: Icons.delete,
title: "Trash",
onTap: openTrash,
),
],
),
  const SizedBox(height: 30),

  Row(
    mainAxisAlignment:
    MainAxisAlignment.spaceBetween,
    children: [
      const Text(
        "Recent Files",
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      TextButton(
        onPressed: () {
          widget.onNavigate(1);
        },
        child: const Text("View All"),
      ),
    ],
  ),

  const SizedBox(height: 10),

  if (recentFiles.isEmpty)
    Container(
      width: double.infinity,
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        borderRadius:
        BorderRadius.circular(20),
        border: Border.all(
          color: Colors.grey.shade300,
        ),
      ),
      child: const Column(
        children: [
          Icon(
            Icons.folder_open,
            size: 48,
            color: Colors.grey,
          ),
          SizedBox(height: 12),
          Text(
            "No files uploaded yet",
            style: TextStyle(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    )
  else
    ListView.separated(
      shrinkWrap: true,
      physics:
      const NeverScrollableScrollPhysics(),
      itemCount: recentFiles.length,
      separatorBuilder: (context, index) =>
      const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final file = recentFiles[index];

        return Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius:
            BorderRadius.circular(16),
            side: BorderSide(
              color: Colors.grey.shade300,
            ),
          ),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor:
              Colors.blue.shade50,
              child: Icon(
                fileIcon(file.mimeType),
                color: Colors.blue,
              ),
            ),
            title: Text(
              file.name,
              maxLines: 1,
              overflow:
              TextOverflow.ellipsis,
            ),
            subtitle: Text(
              formatSize(file.size),
            ),
            trailing: const Icon(
              Icons.chevron_right,
            ),
            onTap: () {
              widget.onNavigate(1);
            },
          ),
        );
      },
    ),
],
),
),
);
}
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius:
      BorderRadius.circular(18),
      child: InkWell(
        borderRadius:
        BorderRadius.circular(18),
        onTap: onTap,
        child: Ink(
          decoration: BoxDecoration(
            borderRadius:
            BorderRadius.circular(18),
            border: Border.all(
              color: Colors.grey.shade300,
            ),
          ),
          child: Column(
            mainAxisAlignment:
            MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: Colors.blue,
                size: 30,
              ),
              const SizedBox(height: 10),
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}