package us.downers.downersnow.Activity;

import android.support.v7.app.ActionBarActivity;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.util.Log;

import org.json.JSONObject;

import us.downers.downersnow.HTTPClient.DGHttpClient;
import us.downers.downersnow.HTTPClient.DGHttpListener;
import us.downers.downersnow.R;





public class HomeActivity extends ActionBarActivity implements DGHttpListener {

    DGHttpClient dgHttpClient;
    static String TAG = "HOME";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_home);

        dgHttpClient = new DGHttpClient();
        dgHttpClient.setOnResponseListener(this);
        try {
            JSONObject params = new JSONObject("{'f':'json','where':'OBJECTID IS NOT NULL'}");
            dgHttpClient.prepareAndSendHttpRequest(this,"GET","http://parcels.downers.us/arcgis/rest/services/Public/Requests311/MapServer/8",params);
        } catch (Exception e) {
            Log.d(TAG, "ERROR: " + e.getMessage());
        }


    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu_home, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    @Override
    public void onResponse(String status, JSONObject response) {
        Log.d(TAG,"RESPONSE: " + response.toString());
    }

}
