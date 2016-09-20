package us.downers.downersnow.HTTPClient;

import android.content.Context;
import android.net.ConnectivityManager;
import android.os.AsyncTask;
import android.net.NetworkInfo;
import android.util.Log;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URLEncoder;
import java.net.URL;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;



public final class DGHttpClient {

    private List<DGHttpListener> DGHttpListeners = new ArrayList<DGHttpListener>();
    public void add(DGHttpListener DGHttpListener) {
        DGHttpListeners.add(DGHttpListener);}
    public void remove(DGHttpListener DGHttpListener) {
        DGHttpListeners.remove(DGHttpListener);}

    HttpURLConnection urlConnection;
    DGHttpListener responseDGHttpListener;
    String resultJSON;
    static String TAG = "HTTPClient";

    public DGHttpClient(){}

    public boolean checkConnectivity (Context context){
        ConnectivityManager connectivityManager = (ConnectivityManager)context.getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo networkInfo = connectivityManager.getActiveNetworkInfo();
        if (networkInfo != null && networkInfo.isConnected()) {
            return true;
        } else {
            return false;
        }
    }

    public String createQuery(JSONObject params) throws IOException, JSONException {
        StringBuilder query = new StringBuilder();
        boolean first = true;

        Iterator<?> keys = params.keys();

        while (keys.hasNext())
        {
            if (first)
                first = false;
            else
                query.append("&");
            String key = (String)keys.next();
            query.append(URLEncoder.encode(key, "UTF-8"));
            query.append("=");
            query.append(URLEncoder.encode(params.get(key).toString(), "UTF-8"));
        }

        return query.toString();
    }

    public void prepareAndSendHttpRequest(Context context, String method, String url, JSONObject params){

        if (checkConnectivity(context)){
            new HttpRequest().execute(method,url,params.toString());
        }

    }

    public void makeHttpRequest(String method, String urlString, JSONObject params) throws IOException,JSONException {
        InputStream is = null;

        try {
            URL url = new URL(urlString);
            urlConnection = (HttpURLConnection) url.openConnection();
            urlConnection.setDoInput(true);
            if (method == "POST") {
                urlConnection.setRequestMethod("POST");
                urlConnection.setDoOutput(true);
                urlConnection.setChunkedStreamingMode(0);
                OutputStream os = urlConnection.getOutputStream();
                BufferedWriter bufferedWriter = new BufferedWriter(new OutputStreamWriter(os, "UTF-8"));
                bufferedWriter.write(createQuery(params));
                bufferedWriter.flush();
                bufferedWriter.close();
                os.close();
            }
            urlConnection.connect();

            int response = urlConnection.getResponseCode();
            Log.d(TAG, "The response is: " + response);
            is = urlConnection.getInputStream();
            // Convert the InputStream into a string
            resultJSON = readStream(is);

        } finally {
            if (is != null){
                is.close();
            }
        }
    }

    public String readStream(InputStream stream) throws IOException {
        String result = "";
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(stream));
        String response = "";
        while ((response = bufferedReader.readLine()) != null) {
            result += response;
        }
        Log.d(TAG,result);
        return result;
    }

    public void setOnResponseListener (DGHttpListener DGHttpListener)
    {
        // Store the DGHttpListener object
        this.DGHttpListeners.add(DGHttpListener);
    }

    public void sendResponse (String response) throws JSONException {
        for (DGHttpListener DGHttpListener : DGHttpListeners){
            DGHttpListener.onResponse("OK",new JSONObject("{'State':'IL'}"));
        }
    }

    private class HttpRequest extends AsyncTask<String, Integer, String> {

        public HttpRequest(){

        }
        @Override
        protected String doInBackground(String... connection) {
            try {
                JSONObject jo = new JSONObject(connection[2]);
                makeHttpRequest(connection[0],connection[1],jo);
                return null;
            } catch (Exception e){
                Log.d(TAG, "Exception: " + e.getMessage());
            }
            return null;
        }

        protected void onProgressUpdate(Integer... progress) {

        }
        // onPostExecute displays the results of the AsyncTask.
        protected void onPostExecute(String result) {
            try {
                sendResponse(resultJSON);
            } catch (Exception e) {
                Log.d(TAG, "onPOSTExecute Exception: " + e.getMessage());
            }
        }
    }


}

