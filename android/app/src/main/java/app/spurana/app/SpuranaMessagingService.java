package app.spurana.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * SPURANA · SpuranaMessagingService — the always-listening ear.
 * Receives data pushes (buzz / inner-sight) even when the app is
 * killed, and raises a full-screen intent that draws over the
 * lock screen and any other app — the way alarm & call apps do.
 */
public class SpuranaMessagingService extends FirebaseMessagingService {

  @Override
  public void onNewToken(String token) {
    // token refresh handled by the JS push layer on next app open
  }

  @Override
  public void onMessageReceived(RemoteMessage msg) {
    Map<String, String> data = msg.getData();
    String type = data.get("channel");
    if (type == null && msg.getNotification() != null) type = "messages";
    if (type == null) type = "messages";

    String name = data.get("name");
    if (name == null && msg.getNotification() != null) name = msg.getNotification().getTitle();
    if (name == null) name = "Your soul";

    if ("buzz".equals(type)) {
      raiseFullScreen("buzz", "\u26A1 " + name + " BUZZED you!", "Your world is shaking\u2026", 51);
    } else if ("akash".equals(type) || "antor".equals(type)) {
      raiseFullScreen(type, "\u2726 " + name, "is reaching through the sky \u2014 tap to answer", 52);
    }
    // ordinary messages/ptt are handled by the system tray notification directly
  }

  private void raiseFullScreen(String route, String title, String body, int id) {
    String chId = "spurana_urgent";
    NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel ch = new NotificationChannel(chId, "Urgent Soul Calls", NotificationManager.IMPORTANCE_HIGH);
      ch.setDescription("Buzz and live sight that must reach you");
      ch.enableVibration(true);
      ch.setVibrationPattern(new long[]{0, 200, 100, 200, 100, 400});
      nm.createNotificationChannel(ch);
    }

    Intent full = new Intent(this, MainActivity.class);
    full.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
    full.putExtra("spurana_route", route);
    PendingIntent pi = PendingIntent.getActivity(this, id, full,
        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

    NotificationCompat.Builder b = new NotificationCompat.Builder(this, chId)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(title)
        .setContentText(body)
        .setPriority(NotificationCompat.PRIORITY_MAX)
        .setCategory(NotificationCompat.CATEGORY_CALL)
        .setAutoCancel(true)
        .setVibrate(new long[]{0, 200, 100, 200, 100, 400})
        .setFullScreenIntent(pi, true);   // this is what draws over the lock screen / any app

    nm.notify(id, b.build());
  }
}
